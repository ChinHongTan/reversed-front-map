import React, { useMemo } from 'react';
import { Polyline } from 'react-leaflet';
import { Voronoi } from 'd3-delaunay';
import { City } from '../../types';
import L from "leaflet";

interface VoronoiBordersProps {
    voronoi: Voronoi<[number, number]>;
    cities: City[];
    nationColorMap: Map<number, string>;
    mapImageBounds: [[number, number], [number, number]];
}

const VoronoiBorders: React.FC<VoronoiBordersProps> = ({ voronoi, cities, nationColorMap, mapImageBounds }) => {
    const borders = useMemo(() => {
        if (!voronoi) return [];

        const lines: {
            id: string;
            positions: [number, number][];
            weight: number;
            color: string;
            opacity: number;
        }[] = [];

        // To avoid duplicate edges, store them in a Set with a unique key
        const edgeSet = new Set<string>();

        for (let i = 0; i < cities.length; i++) {
            const cell = voronoi.cellPolygon(i);
            if (!cell) continue;

            for (let j = 0; j < cell.length - 1; j++) {
                const a = cell[j];
                const b = cell[j + 1];

                // Create a unique key for the edge, order-independent
                const key =
                    a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])
                        ? `${a[0]},${a[1]}|${b[0]},${b[1]}`
                        : `${b[0]},${b[1]}|${a[0]},${a[1]}`;

                if (edgeSet.has(key)) continue;
                edgeSet.add(key);

                // Find the neighboring cell index
                let neighborIndex = -1;
                for (let k = 0; k < cities.length; k++) {
                    if (k === i) continue;
                    const neighborCell = voronoi.cellPolygon(k);
                    if (!neighborCell) continue;
                    for (let l = 0; l < neighborCell.length - 1; l++) {
                        const na = neighborCell[l];
                        const nb = neighborCell[l + 1];
                        if (
                            (na[0] === a[0] && na[1] === a[1] && nb[0] === b[0] && nb[1] === b[1]) ||
                            (na[0] === b[0] && na[1] === b[1] && nb[0] === a[0] && nb[1] === a[1])
                        ) {
                            neighborIndex = k;
                            break;
                        }
                    }
                    if (neighborIndex !== -1) break;
                }

                const city1 = cities[i];
                const city2 = neighborIndex !== -1 ? cities[neighborIndex] : undefined;

                const nation1 = city1?.control_nation?.id;
                const nation2 = city2?.control_nation?.id;

                const isExternal = nation1 !== nation2;

                // Leaflet coordinates are [y, x]
                const p1: [number, number] = [mapImageBounds[1][0] - a[1], a[0]];
                const p2: [number, number] = [mapImageBounds[1][0] - b[1], b[0]];

                lines.push({
                    id: `border-${i}-${j}`,
                    positions: [p1, p2],
                    weight: isExternal ? 2.5 : 0.5,
                    color: isExternal ? '#FFFFFF' : '#000000',
                    opacity: isExternal ? 0.6 : 0.3,
                });
            }
        }
        return lines;

    }, [voronoi, cities, nationColorMap, mapImageBounds]);

    return (
        <>
            {borders.map(border => (
                <Polyline
                    key={border.id}
                    positions={border.positions as L.LatLngExpression[]}
                    pathOptions={{
                        color: border.color,
                        weight: border.weight,
                        opacity: border.opacity,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }}
                />
            ))}
        </>
    );
};

export default VoronoiBorders;