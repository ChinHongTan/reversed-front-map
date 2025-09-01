import React, { useMemo } from "react";
import ReactDOMServer from "react-dom/server";
import { Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
import { City } from "../../types";
import { useUserInteraction, CityMarkerType } from "../../context/UserInteractionContext";
import { FaCrosshairs, FaShieldAlt, FaStar } from "react-icons/fa";

// Import hooks and constants
import { useMapData } from "../../context/MapContext";
import { useUIView } from "../../context/UIViewContext";
import { mapBounds } from "../../constants";

// --- Props ---
interface CityMarkerProps {
	city: City;
	currentZoom: number;
	onCityClick: (city: City) => void;
	onMouseOver: () => void;
	onMouseOut: () => void;
}

const MIN_ICON_ZOOM = -2.5;
const MAX_ICON_ZOOM = 0;
const MIN_ICON_SIZE_NORMAL = 8;
const MAX_ICON_SIZE_NORMAL = 20;
const MIN_ICON_SIZE_CAPITAL = 14;
const MAX_ICON_SIZE_CAPITAL = 32;

const TacticalMarkerIcon: React.FC<{ type: CityMarkerType }> = ({ type }) => {
	const style: React.CSSProperties = {
		position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)',
		fontSize: '16px', color: '#ffc107', filter: 'drop-shadow(0 0 3px #000)',
	};
	if (type === 'attack') return <FaCrosshairs style={style} />;
	if (type === 'defend') return <FaShieldAlt style={style} />;
	if (type === 'priority') return <FaStar style={style} />;
	return null;
};

const CityMarker: React.FC<CityMarkerProps> = ({
												   city,
												   currentZoom,
												   onCityClick,
												   onMouseOver,
												   onMouseOut,
											   }) => {
	// --- Fetch data from contexts ---
	const { nations, nationIdToColorMap, hoveredCityId, highlightedCityIds, nationCodeColorMap } = useMapData();
	const { cityMarkers, isAnimating, attackableCities } = useUserInteraction();
	const { isTacticalMode } = useUIView();

	// --- Derive state internally ---
	const nationColor = city.control_nation
		? nationIdToColorMap.get(city.control_nation.id) || "#FFFFFF"
		: "#FFFFFF";

	const capitalCityIds = useMemo(() => new Set(nations.map(n => n.capital?.id).filter(Boolean)), [nations]);
	const isCapital = capitalCityIds.has(city.id);
	const isHovered = hoveredCityId === city.id;
	const isHighlighted = highlightedCityIds.includes(city.id);
	const showLabel = currentZoom > MIN_ICON_ZOOM || isHovered;
	const isAttackable = attackableCities?.has(city.id) ?? false;
	const attackInfo = attackableCities?.get(city.id) ?? null;
	const inBattle = city.sword === true;

	const calculateFontSize = () => {
		if (isAnimating) return 15; // MIN_FONT_SIZE
		const zoomProgress = Math.max(0, Math.min(1, (currentZoom - (-2)) / (0 - (-2))));
		return 15 + zoomProgress * (40 - 15); // MIN_FONT_SIZE + progress * (MAX_FONT_SIZE - MIN_FONT_SIZE)
	};
	const fontSize = calculateFontSize();

	const cityIcon = useMemo(() => {
		const zoomProgress = Math.max(0, Math.min(1, (currentZoom - MIN_ICON_ZOOM) / (MAX_ICON_ZOOM - MIN_ICON_ZOOM)));
		const minSize = isCapital ? MIN_ICON_SIZE_CAPITAL : MIN_ICON_SIZE_NORMAL;
		const maxSize = isCapital ? MAX_ICON_SIZE_CAPITAL : MAX_ICON_SIZE_NORMAL;
		let iconSize = minSize + (maxSize - minSize) * zoomProgress;
		if (isHighlighted) iconSize *= 1.5;

		const tacticalMarker = cityMarkers.get(city.id);
		const tacticalMarkerHtml = tacticalMarker ? ReactDOMServer.renderToStaticMarkup(<TacticalMarkerIcon type={tacticalMarker} />) : '';
		const attackableIndicatorHtml = isAttackable ? `<div style="position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; border: 3px solid #ffaa00; border-radius: 50%; animation: pulse-attack 1.5s infinite;"></div>` : '';

		let finalColor = nationColor;
		let opacity = 1.0;

		if (isTacticalMode) {
			if (tacticalMarker) {
				switch (tacticalMarker) {
					case 'attack': finalColor = '#e74c3c'; break;
					case 'defend': finalColor = '#3498db'; break;
					case 'priority': finalColor = '#f1c40f'; break;
				}
			} else {
				finalColor = '#808080';
				opacity = 1;
			}
		}

		let cityHtml;
		if (inBattle && !isTacticalMode) {
			iconSize *= 2;
			const defenderColor = nationColor;
			const attackerCodeMatch = city.nation_battle?.nation_icon?.match(/([A-Z]{2,})\d*\.png$/);
			const attackerCode = attackerCodeMatch ? attackerCodeMatch[1] : null;
			const attackerColor = attackerCode ? nationCodeColorMap.get(attackerCode) || "#999999" : "#999999";
			cityHtml = ReactDOMServer.renderToStaticMarkup(
				<div className="battle-icon-concentric">
					<div className="attacker-ring" style={{ backgroundColor: attackerColor, filter: `drop-shadow(0px 0px 4px rgba(0,0,0,0.8))` }}></div>
					<div className="defender-dot" style={{ backgroundColor: defenderColor }}></div>
				</div>
			);
		} else {
			cityHtml = `<div class="${isCapital ? "capital-icon-container" : "city-icon-container"}" style="width: ${iconSize}px; height: ${iconSize}px; background-color: ${finalColor}; --glow-color: ${finalColor}; border-color: rgba(255,255,255,0.5); opacity: ${opacity};"></div>`;
		}

		const finalHtml = `<div style="position: relative; width: ${iconSize}px; height: ${iconSize}px;">${attackableIndicatorHtml}${cityHtml}${tacticalMarkerHtml}</div>`;

		return L.divIcon({
			className: "leaflet-div-icon",
			iconSize: [iconSize, iconSize],
			iconAnchor: [iconSize / 2, iconSize / 2],
			html: finalHtml,
		});

	}, [isCapital, inBattle, nationColor, currentZoom, isAnimating, city.nation_battle, nationCodeColorMap, isHighlighted, cityMarkers, isAttackable, isTacticalMode]);

	return (
		<Marker position={[mapBounds[1][0] - city.y_position, city.x_position]} icon={cityIcon} eventHandlers={{ click: () => onCityClick(city), mouseover: onMouseOver, mouseout: onMouseOut }}>
			{showLabel && (
				<Tooltip permanent direction="right" offset={[10, 0]} className="city-label">
					<span style={{ fontSize: `${fontSize}px` }}>
						{isHovered ? (
							<>
								{city.name} <br />
								控制: {city.control_union?.name || "无"} <br />
								{isCapital && "首都"}
								{inBattle && <><br />{`交戰中 ${city.nation_battle_score || ""}`}</>}
								{isAttackable && attackInfo && (
									<>
										<br />
										<span style={{color: '#ffaa00', fontWeight: 'bold'}}>可攻擊</span><br/>
										<span>戰力: {attackInfo.maxPower}% | 跳躍: {attackInfo.minHops}</span>
									</>
								)}
							</>
						) : (city.name)}
					</span>
				</Tooltip>
			)}
		</Marker>
	);
};

export default React.memo(CityMarker);