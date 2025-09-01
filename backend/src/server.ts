import express from "express";
import http from "http";
import pino from 'pino';
import WebSocket, { WebSocketServer } from "ws";
import path from "path";
import cors from "cors";
import {
	startPhoenixConnection,
	setBroadcastUpdateFunction,
	getCities,
	getNations, getUnionById,
	getNationById,
} from "./services/phoenixService";
import fs from "fs";
import { Path } from "./types";
import connectDB from "./services/database";
import {InitialState, TimelapseEvent} from "./types/timelapse";
const { version } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'));

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

// 檢查 MONGODB_URI，如果存在才連接資料庫
if (process.env.MONGODB_URI) {
  connectDB().catch((error) => {
    logger.error("[Server] Error connecting to database:", error);
    process.exit(1);
  });
} else {
  logger.warn("[Server] MONGODB_URI not found. Timelapse features will be disabled.");
}


connectDB().then(() => {
	const app = express();
	const server = http.createServer(app);
	const wss = new WebSocketServer({server});

	const corsOptions = {
		origin: ['https://rf-map.onrender.com', 'http://localhost:5173'], // Allowed origins
	};

	app.use(cors(corsOptions)); // Enable CORS for all routes

	const PORT = process.env.PORT || 3001; // Backend server port

	// Store connected frontend clients
	const clients = new Set<WebSocket>();

	// Load path data
	let pathData: Path[] = [];
	try {
		const rawPathData = fs.readFileSync(
			path.join(__dirname, "data", "pathData.json"),
			"utf-8"
		);
		pathData = JSON.parse(rawPathData);
		logger.debug(`[Server] Loaded ${pathData.length} paths.`);
	} catch (error) {
		logger.error("[Server] Error loading pathData.json:", error);
	}

	let cityDetailsData = {};
	try {
		const rawDetailsData = fs.readFileSync(
			path.join(__dirname, "data", "cityDetails.json"),
			"utf-8"
		);
		cityDetailsData = JSON.parse(rawDetailsData);
		logger.debug(`[Server] Loaded details for ${Object.keys(cityDetailsData).length} cities.`);
	} catch (error) {
		logger.error("[Server] Error loading cityDetails.json:", error);
	}

	wss.on("connection", (ws) => {
		logger.info("[Server] Frontend client connected");
		clients.add(ws);

		// Send initial data
		const initialCities = getCities(); // Get current cities from phoenixService
		if (initialCities.length > 0) {
			ws.send(
				JSON.stringify({ type: "initial_cities", payload: initialCities })
			);
		}
		const initialNations = getNations(); // Get current nations from phoenixService
		if (initialNations.length > 0) {
			ws.send(
				JSON.stringify({ type: "initial_nations", payload: initialNations })
			);
		}
		// Send path data
		ws.send(JSON.stringify({ type: "initial_paths", payload: pathData }));
		ws.send(JSON.stringify({ type: "initial_city_details", payload: cityDetailsData }));

		ws.on("message", (message) => {
			logger.debug(
				"[Server] Received message from client:",
				message.toString()
			);
		});

		ws.on("close", () => {
			logger.info("[Server] Frontend client disconnected");
			clients.delete(ws);
		});

		ws.on("error", (error) => {
			logger.error("[Server] WebSocket error with client:", error);
			clients.delete(ws);
		});
	});

	// Function for phoenixService to broadcast updates to all connected clients
	function broadcastToClients(data: any) {
		logger.debug(
			`[Server] Attempting to broadcast message of type: "${data.type}" to ${clients.size} clients.`
		); // 确认类型
		if (data.type === "initial_nations") {
			logger.debug(
				`[Server] Broadcasting initial_nations payload. Count: ${
					data.payload ? data.payload.length : "undefined/null"
				}.`,
			);
		}
		const message = JSON.stringify(data);
		clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message);
			}
		});
	}

	// Set this broadcast function in phoenixService
	setBroadcastUpdateFunction(broadcastToClients);

	app.get("/", (_req, res) => {
		res.send("Map Tool Backend is Running!");
	});

	app.get('/api/nations/:id', async (req, res) => {
		try {
			const nationId = parseInt(req.params.id, 10);
			if (isNaN(nationId)) {
				res.status(400).json({ error: 'Invalid Nation ID.' });
				return;
			}
			const nationData = getNationById(nationId);
			if (nationData) {
				res.json(nationData);
			} else {
				res.status(404).json({ error: 'Nation not found.' });
			}
		} catch (error) {
			logger.error({ error }, '[API /api/nations/:id] Failed to get nation details');
			res.status(500).json({ error: 'Failed to get nation details.' });
		}
	});

	app.get('/api/unions/:id', (req, res) => {
		try {
			const unionId = parseInt(req.params.id, 10);
			if (isNaN(unionId)) {
				res.status(400).json({ error: 'Invalid Union ID.' });
				return;
			}
			// getUnionById is now synchronous, but using await here is harmless and good practice
			const unionData = getUnionById(unionId);
			if (unionData) {
				res.json(unionData);
			} else {
				res.status(404).json({ error: 'Union not found.' });
                return;
			}
		} catch (error) {
			logger.error({ error }, '[API /api/unions/:id] Failed to get union details');
			res.status(500).json({ error: 'Failed to get union details.' });
            return;
		}
	});

	app.get('/api/timelapse/logs', async (_req, res) => {
        if (!process.env.MONGODB_URI) {
            res.json([]); // 返回一個空陣列，這樣前端就不會出錯
            return;
        }
		try {
			const logDates = await TimelapseEvent.distinct('logDate');
			logDates.sort((a: string, b: string) => b.localeCompare(a));
			res.json(logDates);
		} catch (error) {
			res.status(500).json({ error: 'Could not list logs.' });
            return;
		}
	});

	app.get('/api/timelapse', async (req, res) => {
        if (!process.env.MONGODB_URI) {
            res.status(503).json({ error: 'Database not configured. Timelapse is disabled.' });
            return;
        }
		const date = req.query.date as string;
		if (!date) {
			res.status(400).json({ error: 'Date parameter is required.' });
			return;
		}
		try {
			// 1. Read the initial state
			const initialStateDoc = await InitialState.findOne({ date });
			const initialCities = initialStateDoc ? initialStateDoc.cities : [];

			// 2. Read the events log
			const events = await TimelapseEvent
				.find({ logDate: date })
				.select('timestamp cityId newController')
				.sort({ timestamp: 'asc' });

			// 3. Send both back to the frontend
			res.json({ initialCities, events });

		} catch (error) {
			logger.error('[API /api/timelapse] Error reading data files:', error);
			res.status(500).json({ error: 'Failed to retrieve timelapse data.' });
		}
	});

	app.get('/api/timelapse/export', async (req, res) => {
		const date = req.query.date as string;
		if (!date) {
			res.status(400).json({ error: 'Date parameter is required.' });
			return;
		}
		try {
			// 1. Read the initial state
			const initialStateDoc = await InitialState.findOne({ date });
			const initialCities = initialStateDoc ? initialStateDoc.cities : [];

			// 2. Read the events log
			const events = await TimelapseEvent.find({ logDate: date }).sort({ timestamp: 'asc' });

			// 3. Create a JSON object to export
			const exportData = {
				initialCities,
				events,
				date,
			};

			// 4. Send the JSON as a downloadable file
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Content-Disposition', `attachment; filename="timelapse-${date}.json"`);
			res.json(exportData);

		} catch (error) {
			logger.error('[API /api/timelapse/export] Error reading data files:', error);
			res.status(500).json({ error: 'Failed to export timelapse data.' });
		}
	});

	app.get('/api/version', (_req, res) => {
		res.json({ version: version });
	});

	startPhoenixConnection().catch((error) => {
		logger.error(
			"[Server] Critical error starting Phoenix connection:",
			error
		);
	});

	server.listen(PORT, () => {
		logger.info(`[Server] Backend server started on http://localhost:${PORT}`);
	});
}).catch((error) => {
	logger.error("[Server] Error connecting to database:", error);
	process.exit(1);
});
