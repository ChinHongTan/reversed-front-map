import React from "react";
import {City, Nation} from "../../types";

import MapComponent from "./MapComponent";
import {VoronoiGeometry} from "../Timelapse/TimelapseView";

// --- Props ---
interface MapViewProps {
	onMapClick: () => void;
	onCityClick: (city: City) => void;
	isTimelapse?: boolean;
	voronoiGeometry?: VoronoiGeometry | null;
	cities?: City[];
	nations?: Nation[];
}

const MapView: React.FC<MapViewProps> = ({
											 onMapClick,
											 onCityClick,
											 isTimelapse,
											 voronoiGeometry,
											 cities,
											 nations,
										 }) => {
	return (
		<MapComponent
			onMapClick={onMapClick}
			onCityClick={onCityClick}
			isTimelapse={isTimelapse}
			voronoiGeometry={voronoiGeometry}
			cities={cities}
			nations={nations}
		/>
	);
};

export default MapView;