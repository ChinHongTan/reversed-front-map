import React, { useMemo } from 'react';
import { Polygon, Polyline } from 'react-leaflet';
import { City, Nation } from '../../types';
import { VoronoiGeometry } from '../Timelapse/TimelapseView';

interface TimelapseVoronoiProps {
    geometry: VoronoiGeometry;
    cities: City[];
    nations: Nation[];
}

const TimelapseVoronoiLayer: React.FC<TimelapseVoronoiProps> = ({ geometry, cities, nations }) => {
    // Fast lookups for color and city control
    const nationColorMap = useMemo(() => new Map(nations.map(n => [n.id, `#${n.city_color}`])), [nations]);
    const cityControlMap = useMemo(() => new Map(cities.map(c => [c.id, c.control_nation?.id])), [cities]);

    return (
        <>
            {/* Render Fills */}
            {geometry.polygons.map(poly => {
                const controllerId = cityControlMap.get(poly.cityId);
                const color = controllerId ? nationColorMap.get(controllerId) || '#888' : '#888';
                return (
                    <Polygon
                        key={`fill-${poly.cityId}`}
                        positions={poly.points}
                        pathOptions={{ fillColor: color, fillOpacity: 0.4, stroke: false }}
                    />
                );
            })}
            {/* Render Borders */}
            {geometry.borders.map(border => {
                const city1 = cities[border.cityIndex1];
                const city2 = cities[border.cityIndex2];
                const isExternal = city1?.control_nation?.id !== city2?.control_nation?.id;

                return (
                    <Polyline
                        key={border.id}
                        positions={border.positions}
                        pathOptions={{
                            color: isExternal ? '#FFFFFF' : '#000000',
                            weight: isExternal ? 2.5 : 0.5,
                            opacity: isExternal ? 0.6 : 0.3,
                        }}
                    />
                );
            })}
        </>
    );
};

export default TimelapseVoronoiLayer;