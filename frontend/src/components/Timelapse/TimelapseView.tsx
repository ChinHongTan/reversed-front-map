import React, {useState, useEffect, useRef} from "react";
import { City } from "../../types";
import { FaHistory, FaLayerGroup, FaBraille, FaUpload, FaPlane, FaRoute } from "react-icons/fa";
import { Delaunay } from 'd3-delaunay';

// --- Components ---
import MapView from "../Map/MapView";
import TimelapseControls from "./TimelapseControls";
import InfoPanel from "../InfoPanel/InfoPanel";
import Toolbar, {ToolbarButtonConfig} from "../common/Toolbar";
import ResizablePanel from "../Ranking/ResizablePanel";
import RankingPanel from "../Ranking/RankingPanel";

// --- Hooks & Context ---
import { useUserInteraction } from "../../context/UserInteractionContext";
import { useMapData } from "../../context/MapContext";
import { useUIView } from "../../context/UIViewContext";
import { useMediaQuery } from '../../hooks/useMediaQuery';

// --- Constants & Config ---
import { mapBounds } from "../../constants";
import { API_URL } from '../../config';
import L from "leaflet";
import './TimelapseView.css';

export interface VoronoiGeometry {
	polygons: { cityId: number; points: L.LatLngExpression[] }[];
	borders: { id: string; positions: L.LatLngExpression[]; cityIndex1: number; cityIndex2: number }[];
}

interface TimelapseEvent {
	timestamp: string;
	cityId: number;
	newController: { id: number; name: string; nation_id: number } | null;
}

interface TimelapseViewProps {
	availableDates: string[];
	importedData?: { initialCities: City[]; events: TimelapseEvent[] } | null;
}

const BASE_PLAYBACK_DELAY = 400;

const TimelapseView: React.FC<TimelapseViewProps> = ({
														 availableDates,
														 importedData
													 }) => {
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	const { nations: baseNations } = useMapData();
	const interaction = useUserInteraction(); // Changed from useMapInteraction

	const {
		isPathsVisible,
		togglePaths,
		isAirRoutesVisible,
		toggleAirRoutes,
		activeRightPanel,
		toggleRankingPanel,
		isVoronoiVisible,
		toggleVoronoi,
		exitTimelapse
	} = useUIView();

	const [isLoading, setIsLoading] = useState(true);
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const [initialCities, setInitialCities] = useState<City[]>([]);
	const [timelapseEvents, setTimelapseEvents] = useState<TimelapseEvent[]>([]);

	// Map state manager
	const [historicalCities, setHistoricalCities] = useState<City[]>([]);
	const [currentEventIndex, setCurrentEventIndex] = useState(0);

	const [isPlaying, setIsPlaying] = useState(false);
	const [playbackSpeed, setPlaybackSpeed] = useState(1);

	const [voronoiGeometry, setVoronoiGeometry] = useState<VoronoiGeometry | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const content = e.target?.result as string;
					const jsonData = JSON.parse(content);
					if (jsonData.initialCities && jsonData.events) {
						processData(jsonData);
					} else {
						alert("Import failed: File is missing 'initialCities' or 'events'.");
					}
				} catch (error) {
					console.error("Error parsing imported file:", error);
					alert("Import failed: Invalid file format.");
				}
			};
			reader.readAsText(file);
		}
		if (event.target) event.target.value = '';
	};

	const timelapseToolbarButtons: ToolbarButtonConfig[] = [
		{ id: 'import', icon: <FaUpload />, label: '導入戰報', onClick: handleImportClick, title: '導入戰報檔案' },
		{ id: 'air-routes', icon: <FaPlane />, label: '航線', isActive: isAirRoutesVisible, onClick: toggleAirRoutes },
		{ id: 'paths', icon: <FaRoute />, label: '路綱', isActive: isPathsVisible, onClick: togglePaths },
		{ id: 'exit', icon: <FaHistory />, label: '返回實時', onClick: exitTimelapse, title: 'Back to Live Map' }, // This now correctly calls exitTimelapse
		{ id: 'ranking', icon: <FaLayerGroup />, label: '排名', isActive: activeRightPanel === 'ranking', onClick: toggleRankingPanel }, // This now correctly uses the context's state and function
		{ id: 'voronoi', icon: <FaBraille />, label: '2D 模式', isActive: isVoronoiVisible, onClick: toggleVoronoi },
	];

	const processData = (data: { initialCities: City[], events: TimelapseEvent[] }) => {
		try {
			if (!data || !data.initialCities || !data.events) {
				alert("資料錯誤：缺少城市或事件資訊。");
				return;
			}

			const cleanedInitialCities = data.initialCities.map(city => ({
				...city,
				sword: false,
				nation_battle: undefined,
				nation_battle_score: null,
				knife_clickable: false,
			}));

			setInitialCities(cleanedInitialCities);
			setHistoricalCities(cleanedInitialCities);
			setTimelapseEvents(data.events);
			setCurrentEventIndex(0);
			setIsPlaying(false);

			if (data.initialCities.length > 0) {
				const cities: City[] = cleanedInitialCities;
				const points: [number, number][] = cities.map((c: City) => [c.x_position, c.y_position]);
				const delaunay = Delaunay.from(points);
				const voronoi = delaunay.voronoi([mapBounds[0][1], mapBounds[0][0], mapBounds[1][1], mapBounds[1][0]]);

				const polygons = cities.map((city: City, index: number) => {
					return {
						cityId: city.id,
						points: voronoi.cellPolygon(index)?.map(p => [mapBounds[1][0] - p[1], p[0]] as [number, number]) || []
					};
				});

				const borders: VoronoiGeometry['borders'] = [];
				const { halfedges, triangles } = delaunay;

				for (let i = 0; i < halfedges.length; i++) {
					const j = halfedges[i];
					if (j < i) continue;

					const triangle1_index = Math.floor(i / 3);
					const triangle2_index = Math.floor(j / 3);

					const circumcenters = (delaunay as any).voronoi().circumcenters as number[];
					const getCircumcenter = (triangleIdx: number): [number, number] | null => {
						if (!circumcenters || triangleIdx < 0) return null;
						const idx = triangleIdx * 2;
						if (idx + 1 >= circumcenters.length) return null;
						return [circumcenters[idx], circumcenters[idx + 1]];
					};

					const p1 = getCircumcenter(triangle1_index);
					const p2 = getCircumcenter(triangle2_index);

					if (p1 && p2) {
						borders.push({
							id: `border-${i}`,
							positions: [[mapBounds[1][0] - p1[1], p1[0]], [mapBounds[1][0] - p2[1], p2[0]]],
							cityIndex1: triangles[i],
							cityIndex2: triangles[j]
						});
					}
				}
				setVoronoiGeometry({ polygons, borders });
			} else {
				setVoronoiGeometry(null);
			}
			setIsLoading(false);
		} catch (error) {
			console.error("處理戰報資料時發生錯誤:", error);
			alert(`處理戰報資料時發生錯誤: ${error}`);
			setIsLoading(false);
		}
	};


	// Fetching and processing logic from API
	useEffect(() => {
		if (importedData) {
			setSelectedDate("Imported File");
			processData(importedData);
		} else if (availableDates.length > 0 && !selectedDate) {
			setSelectedDate(availableDates[0]);
		} else if (availableDates.length === 0 && !importedData) {
			setIsLoading(false);
		}
	}, [importedData, availableDates]);

	useEffect(() => {
		if (!selectedDate || selectedDate === "Imported File") return;

		setIsLoading(true);
		fetch(`${API_URL}/api/timelapse?date=${selectedDate}`)
			.then((res) => res.json())
			.then(processData)
			.catch((err) => {
				console.error("獲取戰報資料失敗:", err);
				setIsLoading(false);
			});
	}, [selectedDate]);

	const calculateStateAtIndex = (index: number) => {
		if (!initialCities.length || !timelapseEvents.length) return;

		let citiesMap = new Map(initialCities.map(c => [c.id, JSON.parse(JSON.stringify(c))]));

		for (let i = 0; i <= index && i < timelapseEvents.length; i++) {
			const event = timelapseEvents[i];
			const city = citiesMap.get(event.cityId);
			if (city) {
				const controllerNation = baseNations.find(n => n.id === event.newController?.nation_id);
				city.control_union = event.newController ?? undefined;
				city.control_nation = controllerNation ? { id: controllerNation.id, name: controllerNation.name } : undefined;
			}
		}
		setHistoricalCities(Array.from(citiesMap.values()));
		setCurrentEventIndex(index);
	};

	const handleTimelapseCityJump = (cityId: number) => {
		const cityToSelect = historicalCities.find(c => c.id === cityId);
		if (cityToSelect) {
			interaction.selectCity(cityToSelect);
		}
	};

	useEffect(() => {
		if (!isPlaying || !timelapseEvents.length) return;
		const delay = BASE_PLAYBACK_DELAY / playbackSpeed;

		const interval = setInterval(() => {
			if (currentEventIndex + 1 >= timelapseEvents.length) {
				setIsPlaying(false);
			} else {
				calculateStateAtIndex(currentEventIndex + 1);
			}
		}, delay);

		return () => clearInterval(interval);
	}, [isPlaying, currentEventIndex, timelapseEvents, playbackSpeed, initialCities, baseNations]);

	const currentEvent = timelapseEvents[currentEventIndex];
	const currentDate = currentEvent ? new Date(currentEvent.timestamp).toLocaleString() : "Start of History";

	if (isLoading) return <div className="loading-screen">加載歷史紀錄中...</div>;
	if (historicalCities.length === 0) {
		return (
			<div className="main-wrapper">
				<div className="loading-screen">沒有找到縮時戰報資料！</div>
				<Toolbar buttons={timelapseToolbarButtons} />
			</div>
		)
	}

	return (
		<div className="main-wrapper">
			<input
				type="file"
				ref={fileInputRef}
				style={{ display: 'none' }}
				accept=".json"
				onChange={handleFileChange}
			/>

			<MapView
				cities={historicalCities}
				nations={baseNations}
				onMapClick={() => interaction.clearSelection()}
				onCityClick={(city) => interaction.selectCity(city)}
				isTimelapse={true}
				voronoiGeometry={voronoiGeometry}
			/>

			{/* Conditional Toolbar */}
			{isDesktop ? (
				<Toolbar buttons={timelapseToolbarButtons} />
			) : (
				<div className="mobile-timelapse-actions">
					{/* A simple exit button for mobile */}
					<button className="mobile-action-button" onClick={exitTimelapse}>
						<FaHistory />
						<span>返回</span>
					</button>
					{/* A toggle for paths/routes */}
					<button className="mobile-action-button" onClick={togglePaths}>
						<FaRoute />
						<span>{isPathsVisible ? "隱藏路綱" : "顯示路綱"}</span>
					</button>
				</div>
			)}

			<div className={`info-panel-container ${interaction.selectedCity ? "is-open" : ""}`}>
				<InfoPanel
					onClose={interaction.clearSelection}
					onUnionClick={() => {}}
					onNationClick={() => {}}
					onCityJump={handleTimelapseCityJump}
				/>
			</div>

			{timelapseEvents.length > 0 && (
				<TimelapseControls
					isPlaying={isPlaying}
					onPlayPause={() => setIsPlaying(!isPlaying)}
					onScrub={calculateStateAtIndex}
					maxIndex={timelapseEvents.length - 1}
					currentIndex={currentEventIndex}
					currentDate={currentDate}
					onSpeedChange={setPlaybackSpeed}
					currentSpeed={playbackSpeed}
					availableDates={availableDates}
					selectedDate={selectedDate}
					onDateChange={setSelectedDate}
				/>
			)}
		</div>
	);
};

export default TimelapseView;