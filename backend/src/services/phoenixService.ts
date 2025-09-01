import { Socket, Channel } from "phoenix";
import axios from "axios";
import FormData from "form-data";
import pino from "pino";
import {
	CitiesResponse,
	City,
	Union,
	UnionsResponse,
	PhoenixUpdate,
    Nation,
    NationsResponse,
} from "../types";
import { TimelapseEvent, InitialState} from "../types/timelapse";
import cron from "node-cron";

// Initialize logger
const logger = pino({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
        },
    },
});

/**
 * Pushes a message to a Phoenix channel with a longer timeout and retry logic.
 * @param channel The Phoenix channel to push to.
 * @param event The event name.
 * @param payload The message payload.
 * @param retries The number of times to retry on timeout.
 * @param timeout The timeout duration for each push attempt in milliseconds. 20 seconds by default.
 * @returns A promise that resolves with the server response.
 */
async function pushWithRetry(
    channel: Channel,
    event: string,
    payload: object,
    retries: number = 3,
    timeout: number = 20000 // 20-second timeout for each attempt
): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await new Promise((resolve, reject) => {
				channel.push(event, payload, timeout)
					.receive("ok", (resp: any) => resolve(resp))
					.receive("error", (reason: any) => reject(new Error(`Event '${event}' failed: ${JSON.stringify(reason)}`)))
					.receive("timeout", () => reject(new Error("timeout")));
            });
            logger.debug(`[PhoenixService] Successfully pushed event '${event}'`);
            return response; // Success
        } catch (error: any) {
            if (error.message === "timeout") {
                logger.warn(`[PhoenixService] Timeout on event '${event}', attempt ${i + 1}/${retries}. Retrying...`);
                if (i === retries - 1) {
                    logger.error(`[PhoenixService] Final attempt for '${event}' timed out. Giving up.`);
                    throw error;
                }
            } else {
                // It was a different error (e.g., "error" receipt), so don't retry
                logger.error(`[PhoenixService] Non-timeout error on event '${event}':`, error.message);
                throw error;
            }
        }
    }
}

async function ensureInitialStateForDate(date: string, cities: City[]) {
	// Prevent creating an initial state with an empty city list, which can happen during startup races.
	if (!cities || cities.length === 0) {
		logger.warn(`[PhoenixService] Attempted to save initial state for ${date} but cities array was empty. Aborting.`);
		return;
	}

	try {
		const cacheKey = `initial_state_checked_${date}`;
		if ((global as any)[cacheKey]) {
			return;
		}

		const existingState = await InitialState.findOne({ date: date });
		if (!existingState) {
			logger.warn(`[PhoenixService] Initial state for today (${date}) not found in DB. Creating...`);
			const newState = new InitialState({ date, cities });
			await newState.save();
			logger.info(`[PhoenixService] Successfully created initial state in DB for ${date}`);
		}
		(global as any)[cacheKey] = true; // Mark this date as checked for this app instance.
	} catch (error) {
		logger.error({ error }, `[PhoenixService] Error in ensureInitialStateForDate for date ${date}`);
	}
}

// 存储从Phoenix获取的数据
let citiesData: City[] = [];
let unionsData: Union[] = [];
let nationsData: Nation[] = [];
let isInitialFetchComplete = false;

// WebSocket广播函数 (当数据更新时调用)
let broadcastUpdate: (data: any) => void = () => {};

function getCurrentDateString() {
	// Get the current date in Taipei time (UTC+8)
	return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" })).toISOString().split('T')[0];
}

async function logTimelapseEvent(eventData: { cityId: number; newController: any; oldController: any;}) {
	if (process.env.NODE_ENV !== 'production' || !process.env.MONGODB_URI) {
        logger.debug(`[Timelapse] Skipping event log in non-production or no-DB environment.`);
        return;
    }
	const logDate = getCurrentDateString();
	await ensureInitialStateForDate(logDate, citiesData);
	try {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

		const existingEvent = await TimelapseEvent.findOne({
			cityId: eventData.cityId,
			'newController.id': eventData.newController?.id,
			'oldController.id': eventData.oldController?.id, // 也檢查舊控制器以增加準確性
			timestamp: { $gte: fiveMinutesAgo }
		});

		if (existingEvent) {
			logger.warn(`[Timelapse] Duplicate event detected via DB check for city ${eventData.cityId}. Skipping log.`);
			return;
		}

		// 如果沒有找到重複事件，才建立並儲存新的事件。
		const event = new TimelapseEvent({
			...eventData,
			timestamp: new Date(),
			logDate: logDate,
		});
		await event.save();
		logger.debug(`[Timelapse] Successfully logged event for city ${eventData.cityId} to DB.`);
	} catch (error) {
		logger.error({ error }, "[PhoenixService] Failed to log timelapse event to MongoDB");
	}
}

export function setBroadcastUpdateFunction(fn: (data: any) => void) {
	broadcastUpdate = fn;
}

require("dotenv").config();
const API_HOST = process.env.GAME_API_HOST || "api.komisureiya.com";
const API_KEY = process.env.GAME_API_KEY || "rfront2023";
const APP_VERSION = "2.21";
const LOCALE = "zh_TW";

let userToken: string | null = null;
let userId: string | null = null;
let phoenixSocket: Socket | null = null;
let playerChannel: Channel | null = null;
let allPlayersChannel: Channel | null = null;
let localeChannel: Channel | null = null;

let isConnecting = false;
let retryTimeout: NodeJS.Timeout | null = null;

function cleanupConnection() {
	logger.debug("[PhoenixService] Cleaning up existing connection...");
	if (retryTimeout) {
		clearTimeout(retryTimeout);
		retryTimeout = null;
	}

	const channels = [playerChannel, allPlayersChannel, localeChannel];
	channels.forEach(channel => {
		if (channel && channel.state !== 'closed') {
			channel.leave().receive("ok", () => logger.info(`[PhoenixService] Left channel ${channel.topic} cleanly.`));
		}
	});

	if (phoenixSocket) {
		phoenixSocket.off(['open']);
		phoenixSocket.off(['close']);
		phoenixSocket.off(['error']);

		phoenixSocket.disconnect();
		logger.info("[PhoenixService] Phoenix socket disconnected.");
	}

	phoenixSocket = null;
	playerChannel = null;
	allPlayersChannel = null;
	localeChannel = null;
	isConnecting = false;
}

async function loginByEmailPassword(
	email: string,
	password: string
): Promise<void> {
	const url = `https://${API_HOST}/api/users/log_in`;
	const payload = new FormData();
	payload.append("user[email]", email);
	payload.append("user[password]", password);
	payload.append("locale", LOCALE);
	payload.append("key", API_KEY);
	payload.append("app_version", APP_VERSION);

	const headers = {
		Accept: "application/json, text/plain, */*",
		"x-requested-with": "tw.twhawk.reversedfront",
		...payload.getHeaders(),
	};

	logger.info(`[PhoenixService] Attempting login with email ${email}...`);
	try {
		const response = await axios.post(url, payload, { headers });
		const loginData = response.data as {
			data?: { user_token?: string; user_id?: string };
		};

		if (!loginData?.data?.user_token || !loginData?.data?.user_id) {
			throw new Error("Login response missing token or user_id.");
		}
		userToken = loginData.data.user_token;
		userId = loginData.data.user_id;
		logger.info(`[PhoenixService] Login successful. User ID: ${userId}`);
	} catch (error: any) {
		const errorMessage =
			error.response?.data?.error ||
			error.response?.data?.message ||
			error.message ||
			"Unknown login error";
		logger.error(`[PhoenixService] Login failed: ${errorMessage}`);
		throw new Error(`Login failed: ${errorMessage}`);
	}
}

async function connectToPhoenix() {
	if (isConnecting) {
		logger.warn("[PhoenixService] Connection attempt already in progress. Skipping.");
		return;
	}

	if (phoenixSocket && phoenixSocket.isConnected()) {
		logger.info("[PhoenixService] Already connected. Skipping reconnection.");
		return;
	}

	if (!userToken || !userId) {
		logger.error("[PhoenixService] Cannot connect: User not logged in.");
		return;
	}

	isConnecting = true;

	// 清理任何殘留的連線和計時器
	cleanupConnection();

	const wsUrl = `wss://${API_HOST}/socket`;
	phoenixSocket = new Socket(wsUrl, {
		transport: WebSocket,
		params: { userToken, locale: LOCALE },
		heartbeatIntervalMs: 15000, // 15 seconds
	});
    logger.debug(`[PhoenixService] Connecting to Phoenix WebSocket at ${wsUrl}...`);

	let retryCount = 0;
	const maxRetries = 5;

	// Retry logic for connection
	function retryConnection() {
		if (retryCount < maxRetries) {
			retryCount++;
			logger.info(`[PhoenixService] Retrying connection... (Attempt ${retryCount})`);
			connectToPhoenix();
		} else {
			logger.error("[PhoenixService] Max retries reached. Giving up on Phoenix WebSocket connection.");
			isConnecting = false;
			phoenixSocket?.disconnect();
		}
	}

	phoenixSocket.onOpen(() => {
		logger.info("[PhoenixService] Connected to Phoenix WebSocket!");
		// Reset retry count on successful connection
		isConnecting = false;
		retryCount = 0;
		joinAllChannels();
	});
	phoenixSocket.onError((error: any) => {
		logger.error("[PhoenixService] Phoenix WebSocket error:", error);
		// Retry connection on error

		if (!isConnecting) {
			isConnecting = true;
			retryTimeout = setTimeout(() => {
				logger.info("[PhoenixService] Retrying Phoenix WebSocket connection...");
				retryConnection();
			}, 5000);
		}

	});
	phoenixSocket.onClose(() => {
		logger.info("[PhoenixService] Phoenix WebSocket connection closed.");
		// Retry connection
		if (!isConnecting) {
			isConnecting = true;
			retryTimeout = setTimeout(() => {
				logger.info("[PhoenixService] Retrying Phoenix WebSocket connection...");
				retryConnection();
			}, 5000);
		}
	});

	phoenixSocket.connect();
}

async function joinAllChannels() {
	if (!phoenixSocket) return;

	const playerChannelName = `player:${userId}`;
	const allPlayersChannelName = "all_players";
	const localeChannelName = `locale:${LOCALE}`;

	playerChannel = phoenixSocket.channel(playerChannelName, {
		ref: 1,
		fake: "ChannelPlayer",
		fake2: 1,
	});
	allPlayersChannel = phoenixSocket.channel(allPlayersChannelName, {
		ref: 1,
		fake: "ChannelAllPlayer",
	});
	localeChannel = phoenixSocket.channel(localeChannelName, {
		ref: 1,
		fake: "locale",
	});

	const joinChannel = async (channel: Channel, name: string) => {
		return new Promise((resolve, reject) => {
			channel
				.join()
				.receive("ok", (resp: any) => {
					logger.info(`[PhoenixService] Joined ${name} successfully`);
					// Handle "update_data" on all channels
					channel.on("update_data", (payload: PhoenixUpdate) => {
						logger.debug(`[PhoenixService] Received update_data on ${name}:`, payload);
						handlePhoenixUpdate(payload);
					});
					resolve(resp);
				})
				.receive("error", (resp: any) => {
					logger.error(`[PhoenixService] Failed to join ${name}:`, resp);
					reject(new Error(`Join ${name} failed: ${resp}`));
				})
				.receive("timeout", () => {
					logger.error(`[PhoenixService] Timeout joining ${name}`);
					reject(new Error(`Timeout joining ${name}`));
				});
		});
	};

	try {
		logger.info("[PhoenixService] Joining channels...");
		await Promise.all([
			joinChannel(playerChannel, playerChannelName),
			joinChannel(allPlayersChannel, allPlayersChannelName),
			joinChannel(localeChannel, localeChannelName),
		]);
		logger.info("[PhoenixService] All channels joined.");
		await fetchInitialData();
	} catch (error) {
		logger.error(
			"[PhoenixService] Error joining one or more channels:",
			error
		);
	}
}

async function fetchInitialData() {
	if (!playerChannel) return;

	isInitialFetchComplete = false;

	const fetchData = async () => {
        try {
            // Fetch Cities
            const citiesResponse: CitiesResponse = await pushWithRetry(playerChannel!, "cities", { body: "" });
            logger.info(`[PhoenixService] Received initial cities: ${citiesResponse.cities.length}`);
            citiesData = citiesResponse.cities;
            broadcastUpdate({ type: "initial_cities", payload: citiesData });

            // After successfully fetching cities, check if the initial state file exists and create it if not.
			const today = getCurrentDateString();
			await ensureInitialStateForDate(today, citiesData);

            // Fetch Unions
            const unionsResponse: UnionsResponse = await pushWithRetry(playerChannel!, "unions", { body: "" });
            logger.info(`[PhoenixService] Received initial unions: ${unionsResponse.unions.length}`);
            unionsData = unionsResponse.unions;
            broadcastUpdate({ type: "initial_unions", payload: unionsData });

            // Fetch Nations
            const nationsResponse: NationsResponse = await pushWithRetry(playerChannel!, "nations", { body: "" });
            if (nationsResponse && nationsResponse.nations) {
                logger.info(`[PhoenixService] Received initial nations: ${nationsResponse.nations.length}`);
                nationsData = nationsResponse.nations;
                broadcastUpdate({ type: 'initial_nations', payload: nationsData });
            } else {
                 logger.warn("[PhoenixService] Received nations response, but 'nations' array is missing.");
            }

			isInitialFetchComplete = true;

        } catch (error) {
			logger.error({ error }, "[PhoenixService] Failed to fetch initial data after retries");
        }
    };

    await fetchData();
}

function handlePhoenixUpdate(update: PhoenixUpdate) {
	if (!isInitialFetchComplete) {
		logger.debug("[PhoenixService] Skipping update_data because initial fetch is not complete.");
		return;
	}
	let changed = false;

	if (update.cities) {
        update.cities.forEach(async (cityUpdate) => {
            const index = citiesData.findIndex((c) => c.id === cityUpdate.id);
            if (index === -1) return;

            const oldCity = { ...citiesData[index] };
            const newCity = { ...oldCity, ...cityUpdate };

            const oldControllerId = oldCity.control_union?.id;
            const newControllerId = newCity.control_union?.id;
            
            if (oldControllerId !== newControllerId) {
				logger.debug(`[Timelapse] Controller change detected for ${newCity.name} (ID: ${newCity.id}). Passing to logger.`);
				await logTimelapseEvent({
					cityId: newCity.id,
					newController: newCity.control_union || null,
					oldController: oldCity.control_union || null,
				});
            }

			citiesData[index] = newCity;
			changed = true;
		});
	}

	if (update.unions) {
		update.unions.forEach((updatedUnion) => {
			const index = unionsData.findIndex((u) => u.id === updatedUnion.id);
			if (index === -1) {
				// 如果找不到，直接添加新的聯盟
				unionsData.push(updatedUnion as Union);
				changed = true;
				return;
			}
			unionsData[index] = { ...unionsData[index], ...updatedUnion };
			changed = true;
		});
	}

    if (update.nations) {
		update.nations.forEach((updatedNation) => {
			const index = nationsData.findIndex((n) => n.id === updatedNation.id);
			if (index === -1) return;

			nationsData[index] = { ...nationsData[index], ...updatedNation };
			changed = true;
		});
	}

	if (changed) {
		broadcastUpdate({ type: 'delta_update', payload: update });
	}
}

export async function startPhoenixConnection(
	email?: string,
	password?: string
) {
	const userEmail = email || process.env.GAME_EMAIL;
	const userPassword = password || process.env.GAME_PASSWORD;

	if (!userEmail || !userPassword) {
		logger.error(
			"[PhoenixService] Email or password not provided for login."
		);
		return;
	}

	try {
		await loginByEmailPassword(userEmail, userPassword);
		await connectToPhoenix();
	} catch (error) {
		logger.error(
			"[PhoenixService] Failed to start Phoenix connection:",
			error
		);
	}
}

cron.schedule("0 3 * * *", async () => { // 每天凌晨 3 點執行
	logger.info("[Cron Job] Running daily cleanup of old timelapse data...");
	try {
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		// YYYY-MM-DD 格式
		const cutOffDateString = thirtyDaysAgo.toISOString().split('T')[0];

		// 刪除超過 30 天的事件
		const eventsResult = await TimelapseEvent.deleteMany({ logDate: { $lt: cutOffDateString } });
		logger.info(`[Cron Job] Deleted ${eventsResult.deletedCount} old timelapse events.`);

		// 刪除超過 30 天的初始狀態
		const statesResult = await InitialState.deleteMany({ date: { $lt: cutOffDateString } });
		logger.info(`[Cron Job] Deleted ${statesResult.deletedCount} old initial states.`);

	} catch (error) {
		logger.error("[Cron Job] Error during data cleanup:", error);
	}
}, {
	timezone: "Asia/Taipei"
});

export const getUnionById = (id: number): Union | null => {
	const union = unionsData.find(u => u.id === id);
	return union || null;
}

export const getNationById = (id: number): Nation | null => {
	const nation = nationsData.find(n => n.id === id);
	return nation || null;
}

export const getCities = () => citiesData;
export const getUnions = () => unionsData;
export const getNations = () => nationsData;
