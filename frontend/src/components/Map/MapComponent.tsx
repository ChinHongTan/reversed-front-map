import React, { useEffect, useMemo, useState } from "react";
import {
	MapContainer,
	Polyline,
	ImageOverlay,
	useMap,
	ZoomControl,
	useMapEvents,
	Marker,
} from "react-leaflet";
import L, { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";
import { City, Nation } from "../../types";
import CityMarker from "./CityMarker";
import { useMapData } from "../../context/MapContext";
import {useUserInteraction} from "../../context/UserInteractionContext";
import VoronoiLayer from './VoronoiLayer';
import { VoronoiGeometry } from "../Timelapse/TimelapseView";
import { mapBounds } from "../../constants";
import TimelapseVoronoiLayer from "./TimelapseVoronoiLayer";
import { useUIView } from "../../context/UIViewContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";

// Leaflet default icon issue fix
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
	iconRetinaUrl,
	iconUrl,
	shadowUrl,
});

interface MapComponentProps {
	// Callbacks from parent
	onCityClick: (city: City) => void;
	onMapClick: () => void;
	// Special-case props for different modes
	isTimelapse?: boolean;
	voronoiGeometry?: VoronoiGeometry | null;
	// Optional data overrides for timelapse mode
	cities?: City[];
	nations?: Nation[];
}

const MapComponent: React.FC<MapComponentProps> = ({
													   onCityClick,
													   onMapClick,
													   isTimelapse = false,
													   voronoiGeometry,
													   cities: historicalCities,
													   nations: historicalNations,
												   }) => {
	// --- Fetch data and state from contexts ---
	const {
		cities: liveCities,
		paths,
		nations: liveNations,
		hoveredCityId,
		setHoveredCityId,
		setHighlightedCityIds,
	} = useMapData();

	const {
		mapView,
		onMapViewComplete,
		isAnimating,
		onAnimationEnd,
		userRoutes,
		removeUserRoute,
		cityMarkers
	} = useUserInteraction();

	const { isVoronoiVisible, isTacticalMode, isAirRoutesVisible, isPathsVisible } = useUIView();

	// --- Determine which data to use (live vs. historical) ---
	const cities = historicalCities || liveCities;
	const nations = historicalNations || liveNations;

	const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);

	const MAX_Y = mapBounds[1][0];
	const isDesktop = useMediaQuery('(min-width: 1024px)');
	const [currentZoom, setCurrentZoom] = useState(isDesktop ? -3 : -4);

	const MapController = () => {
		const map = useMap();
		useEffect(() => { if (mapView) { map.flyTo(mapView.center, mapView.zoom); onMapViewComplete(); } }, [map, mapView]);
		useEffect(() => { setCurrentZoom(map.getZoom()); }, [map]);
		useMapEvents({
			zoomend: () => setCurrentZoom(map.getZoom()),
			click: () => onMapClick(),
			moveend: () => { if (isAnimating) onAnimationEnd(); },
		});
		return null;
	};

	const handleMouseOver = (cityId: number) => {
		setHoveredCityId(cityId);
		const connectedAirCityIds = paths.filter(p => p.type === "air" && (p.from === cityId || p.to === cityId)).map(p => (p.from === cityId ? p.to : p.from));
		setHighlightedCityIds(connectedAirCityIds);
	};

	const handleMouseOut = () => {
		setHoveredCityId(null);
		setHighlightedCityIds([]);
	};

	const cityMap = useMemo(() => new Map(cities.map(city => [city.id, city])), [cities]);

	const pathLines = useMemo(() => {
		return paths.map((path, index) => {
			const fromCity = cityMap.get(path.from);
			const toCity = cityMap.get(path.to);
			if (!fromCity || !toCity) return null;
			const isAirRoute = path.type === "air";
			const isHovered = hoveredCityId === fromCity.id || hoveredCityId === toCity.id;
			if (isAirRoute && !isAirRoutesVisible && !isHovered) return null;
			if (!isAirRoute && !isPathsVisible) return null;
			let color, weight, dashArray, opacity;
			switch (path.type) {
				case "rail": color = "rgba(255, 255, 255, 0.8)"; weight = 4; dashArray = undefined; opacity = 0.8; break;
				case "road": color = "rgba(255, 255, 255, 0.8)"; weight = 2; dashArray = "4, 4"; opacity = 0.8; break;
				case "air": color = "#FFD700"; weight = isHovered ? 3 : 2; dashArray = "10, 10"; opacity = isHovered ? 0.9 : 0.55; break;
				case "sea": color = "#00BFFF"; weight = 2; dashArray = "12, 6, 3, 6"; opacity = 0.6; break;
			}
			return <Polyline key={`path-${index}`} positions={[[MAX_Y - fromCity.y_position, fromCity.x_position], [MAX_Y - toCity.y_position, toCity.x_position]]} pathOptions={{ color, weight, dashArray, opacity }} />;
		}).filter(Boolean);
	}, [paths, cityMap, MAX_Y, isAirRoutesVisible, isPathsVisible, hoveredCityId]);

	const userRouteLines = useMemo(() => {
		return userRoutes.map(route => {
			const fromCity = cityMap.get(route.from);
			const toCity = cityMap.get(route.to);
			if (!fromCity || !toCity) return null;

			const fromPos: LatLngTuple = [MAX_Y - fromCity.y_position, fromCity.x_position];
			const toPos: LatLngTuple = [MAX_Y - toCity.y_position, toCity.x_position];

			const angle = Math.atan2(fromPos[1] - toPos[1], fromPos[0] - toPos[0]) * (180 / Math.PI) + 180;

			const arrowIcon = L.divIcon({
				className: 'user-route-arrow',
				html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24px" height="24px">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="${route.color}" transform="rotate(${angle} 12 12)"/>
                    </svg>`,
				iconSize: [24, 24],
				iconAnchor: [12, 12]
			});

			const midPoint: LatLngTuple = [(fromPos[0] + toPos[0]) / 2, (fromPos[1] + toPos[1]) / 2];
			const isHovered = route.id === hoveredRouteId;

			return (
				<React.Fragment key={route.id}>
					<Polyline
						positions={[fromPos, toPos]}
						pathOptions={{ color: route.color, weight: isHovered ? 7 : 4, opacity: 0.9 }}
						eventHandlers={{
							mouseover: () => setHoveredRouteId(route.id),
							mouseout: () => setHoveredRouteId(null)
						}}
					/>
					<Marker position={midPoint} icon={arrowIcon} interactive={false} />
				</React.Fragment>
			);
		}).filter(Boolean);
	}, [userRoutes, cityMap, MAX_Y, removeUserRoute, hoveredRouteId]);

	const maxMapBounds: [LatLngTuple, LatLngTuple] = [[-1500, -1600], [7023 + 1500, 10516 + 1600]];

	return (
		<MapContainer
			center={[MAX_Y / 2, mapBounds[1][1] / 2]}
			zoom={isDesktop ? -3 : -4}
			minZoom={isDesktop ? -3 : -4}
			maxZoom={0}
			maxBounds={maxMapBounds}
			zoomSnap={0.1}
			zoomDelta={0.25}
			zoomAnimation={false}
			wheelDebounceTime={10}
			crs={L.CRS.Simple}
			style={{ height: "100%", width: "100%" }}
			scrollWheelZoom={true}
			zoomControl={false}
		>
			<ZoomControl position="bottomright" />
			<MapController />
			<ImageOverlay url="/map.png" bounds={mapBounds} />

			{isVoronoiVisible && (
				isTimelapse && voronoiGeometry ? (
					<TimelapseVoronoiLayer geometry={voronoiGeometry} cities={cities} nations={nations} />
				) : (
					<VoronoiLayer
						cities={cities}
						nations={nations}
						mapImageBounds={mapBounds as [[number, number], [number, number]]}
						isTacticalMode={isTacticalMode}
						cityMarkers={cityMarkers}
					/>
				)
			)}

			{pathLines}
			{userRouteLines}
			{cities.map((city) => {
				return (
					<CityMarker
						key={city.id}
						city={city}
						currentZoom={currentZoom}
						onCityClick={onCityClick}
						onMouseOver={() => handleMouseOver(city.id)}
						onMouseOut={handleMouseOut}
					/>
				);
			})}
		</MapContainer>
	);
};

export default MapComponent;