import React, {createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo} from 'react';
import {
    connectWebSocket,
    addWebSocketListener,
    removeWebSocketListener,
    MessageHandler,
} from '../services/socketService';
import { City, Nation, Path, Union, CityDetails, WebSocketMessage } from '../types';
import { NATION_CODE_MAP } from '../constants';

interface MapState {
    cities: City[];
    paths: Path[];
    nations: Nation[];
    unions: Union[];
    cityDetails: CityDetails;
    nationCodeColorMap: Map<string, string>;
    nationIdToColorMap: Map<number, string>;
    codeToNationName: { [key: string]: string };
    isLoading: boolean;
    hoveredCityId: number | null;
    highlightedCityIds: number[];
    setHoveredCityId: (id: number | null) => void;
    setHighlightedCityIds: (ids: number[]) => void;
}

// Create the context with a default value
const MapContext = createContext<MapState | undefined>(undefined);

// Create the Provider component
export const MapProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<Omit<MapState, 'nationCodeColorMap' | 'nationIdToColorMap' | 'isLoading' | 'hoveredCityId' | 'highlightedCityIds' | 'setHoveredCityId' | 'setHighlightedCityIds' | 'codeToNationName'>>({
        cities: [],
        paths: [],
        nations: [],
        unions: [],
        cityDetails: {},
    });
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCityId, setHoveredCityId] = useState<number | null>(null);
    const [highlightedCityIds, setHighlightedCityIds] = useState<number[]>([]);

    const handleWebSocketMessage: MessageHandler = useCallback((data: WebSocketMessage) => {
        switch (data.type) {
            case 'initial_cities':
                setState(s => ({ ...s, cities: data.payload }));
                setIsLoading(false); // Data has loaded
                break;
            case 'initial_paths':
                setState(s => ({ ...s, paths: data.payload }));
                break;
            case 'initial_nations':
                setState(s => ({ ...s, nations: data.payload }));
                break;
            case 'initial_unions':
                setState(s => ({ ...s, unions: data.payload }));
                break;
            case 'initial_city_details':
                setState(s => ({ ...s, cityDetails: data.payload }));
                break;
            case 'delta_update': {
                const { cities: updatedCities, unions: updatedUnions, nations: updatedNations } = data.payload;
                setState(prevState => {
                    const newState = { ...prevState };
                    if (updatedCities) {
                        const citiesMap = new Map(prevState.cities.map(c => [c.id, c]));
                        updatedCities.forEach((cityUpdate: Partial<City>) => {
                            const existing = citiesMap.get(cityUpdate.id!);
                            if (existing) citiesMap.set(cityUpdate.id!, { ...existing, ...cityUpdate });
                        });
                        newState.cities = Array.from(citiesMap.values());
                    }
                    if (updatedUnions) {
                        const unionsMap = new Map(prevState.unions.map(u => [u.id, u]));
                        updatedUnions.forEach((unionUpdate: Partial<Union>) => {
                            const existing = unionsMap.get(unionUpdate.id!);
                            if (existing) unionsMap.set(unionUpdate.id!, { ...existing, ...unionUpdate });
                        });
                        newState.unions = Array.from(unionsMap.values());
                    }
                    if (updatedNations) {
                        const nationsMap = new Map(prevState.nations.map(n => [n.id, n]));
                        updatedNations.forEach((nationUpdate: Partial<Nation>) => {
                            const existing = nationsMap.get(nationUpdate.id!);
                            if (existing) nationsMap.set(nationUpdate.id!, { ...existing, ...nationUpdate });
                        });
                        newState.nations = Array.from(nationsMap.values());
                    }
                    return newState;
                });
                break;
            }
        }
    }, []);

    useEffect(() => {
        connectWebSocket();
        addWebSocketListener(handleWebSocketMessage);
        return () => removeWebSocketListener(handleWebSocketMessage);
    }, [handleWebSocketMessage]);

    // Derived state: create the color map from nations data
    const nationCodeColorMap = React.useMemo(() => {
        const map = new Map<string, string>();
        state.nations.forEach((nation) => {
            const nationCode = NATION_CODE_MAP[nation.name];
            if (nationCode) map.set(nationCode, `#${nation.city_color}`);
        });
        return map;
    }, [state.nations]);

    const nationIdToColorMap = useMemo(() => {
        const map = new Map<number, string>();
        state.nations.forEach(nation => {
            map.set(nation.id, `#${nation.city_color}`);
        });
        return map;
    }, [state.nations]);

    const codeToNationName = useMemo(() => Object.entries(NATION_CODE_MAP).reduce((acc, [name, code]) => { acc[code] = name; return acc; }, {} as { [key: string]: string }), []);


    const value = {
        ...state,
        nationCodeColorMap,
        nationIdToColorMap,
        isLoading,
        hoveredCityId,
        highlightedCityIds,
        setHoveredCityId,
        setHighlightedCityIds,
        codeToNationName,
    };

    return (
        <MapContext.Provider value={value}>
            {children}
        </MapContext.Provider>
    );
};

// Create a custom hook for easy consumption of the context
export const useMapData = () => {
    const context = useContext(MapContext);
    if (context === undefined) {
        throw new Error('useMapData must be used within a MapProvider');
    }
    return context;
};