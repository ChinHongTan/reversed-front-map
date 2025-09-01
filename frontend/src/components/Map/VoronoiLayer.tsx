import React, { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import { Delaunay } from 'd3-delaunay';
import { City, Nation } from '../../types';
import VoronoiBorders from './VoronoiBorders';
import L from "leaflet";
import { CityMarkerType } from "../../context/UserInteractionContext";

interface VoronoiLayerProps {
    cities: City[];
    nations: Nation[];
    mapImageBounds: [[number, number], [number, number]];
    isTacticalMode?: boolean;
    cityMarkers?: Map<number, CityMarkerType>;
}

const VoronoiLayer: React.FC<VoronoiLayerProps> = ({ cities, nations, mapImageBounds, isTacticalMode, cityMarkers }) => {
    const nationColorMap = useMemo(() =>
            new Map(nations.map(n => [n.id, `#${n.city_color}`])),
        [nations]);

    const { voronoi, polygons } = useMemo(() => {
        if (cities.length === 0) return { voronoi: null, polygons: [] };

        const points = cities.map(c => [c.x_position, c.y_position] as [number, number]);
        const delaunay = Delaunay.from(points);
        const voronoiInstance = delaunay.voronoi([
            mapImageBounds[0][1], mapImageBounds[0][0],
            mapImageBounds[1][1], mapImageBounds[1][0]
        ]);

        const cityPolygons = cities.map((city, index) => {
            const polygonPoints = voronoiInstance.cellPolygon(index);
            if (!polygonPoints) return null;

            const latLngs = polygonPoints.map(p => [mapImageBounds[1][0] - p[1], p[0]]);

            // === 核心顏色判斷邏輯 ===
            let color = '#888888';
            let fillOpacity = 0.4;

            if (isTacticalMode && cityMarkers) {
                const marker = cityMarkers.get(city.id);
                fillOpacity = 0.7;
                switch (marker) {
                    case 'attack': color = '#e74c3c'; break;
                    case 'defend': color = '#3498db'; break;
                    case 'priority': color = '#f1c40f'; break;
                    default:
                        // 未標記的城市，背景設為半透明灰色
                        color = '#666666';
                        fillOpacity = 0.5;
                }
            } else {
                // 非戰術模式，使用原本的勢力顏色邏輯
                color = city.control_nation
                    ? nationColorMap.get(city.control_nation.id) || '#888888'
                    : '#888888';
            }

            return {
                id: city.id,
                points: latLngs,
                color: color,
                opacity: fillOpacity
            };
        }).filter(p => p !== null);

        return { voronoi: voronoiInstance, polygons: cityPolygons };
    }, [cities, nationColorMap, mapImageBounds, isTacticalMode, cityMarkers]);

    if (!voronoi) return null;

    return (
        <>
            {polygons.map(p => (
                <Polygon
                    key={`fill-${p!.id}`}
                    positions={p!.points as L.LatLngExpression[]}
                    pathOptions={{
                        fillColor: p!.color,
                        fillOpacity: p!.opacity,
                        stroke: false
                    }}
                />
            ))}
            <VoronoiBorders
                voronoi={voronoi}
                cities={cities}
                nationColorMap={nationColorMap}
                mapImageBounds={mapImageBounds}
            />
        </>
    );
};

export default VoronoiLayer;