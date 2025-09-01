import {createContext, useContext, useState, ReactNode, useCallback, useEffect} from 'react';
import { City, AttackInfo, UnionData, Nation } from '../types';
import {LatLngTuple} from "leaflet";
import {useMapData} from "./MapContext";
import {MAX_Y} from "../constants";
import { getUnionDetails, getNationDetails } from '../services/apiService';

export type DrawingMode = 'idle' | 'route_start';
export type CityMarkerType = 'attack' | 'defend' | 'priority';

export interface UserRoute {
    id: string;
    from: number;
    to: number;
    color: string;
}

interface UserInteractionState {
    // City, Union, and Nation Selection & Map View
    selectedCity: City | null;
    selectedUnion: UnionData | null;
    selectedNation: Nation | null;
    isFetchingDetails: boolean;
    mapView: { center: LatLngTuple; zoom: number } | null;
    isAnimating: boolean;
    selectCity: (city: City) => void;
    selectUnion: (unionId: number) => Promise<void>;
    selectNation: (nationId: number) => Promise<void>;
    clearSelection: () => void;
    onMapViewComplete: () => void;
    onAnimationEnd: () => void;

    cityMarkers: Map<number, CityMarkerType>;
    setCityMarker: (cityId: number, marker: CityMarkerType | null) => void;
    drawingMode: DrawingMode;
    setDrawingMode: (mode: DrawingMode) => void;
    userRoutes: UserRoute[];
    addUserRoute: (route: Omit<UserRoute, 'id'>) => void;
    removeUserRoute: (routeId: string) => void;
    startCity: City | null;
    setStartCity: (city: City | null) => void;
    routeColor: string;
    setRouteColor: (color: string) => void;
    attackableCities: Map<number, AttackInfo> | null;
    setAttackableCities: (cities: Map<number, AttackInfo> | null) => void;
    markingMode: CityMarkerType | null;
    setMarkingMode: (mode: CityMarkerType | null) => void;
}

const UserInteractionContext = createContext<UserInteractionState | undefined>(undefined);

export const UserInteractionProvider = ({ children }: { children: ReactNode }) => {
    const { cities } = useMapData();
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [selectedUnion, setSelectedUnion] = useState<UnionData | null>(null);
    const [selectedNation, setSelectedNation] = useState<Nation | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const [mapView, setMapView] = useState<{ center: LatLngTuple; zoom: number } | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [cityMarkers, setCityMarkers] = useState(new Map<number, CityMarkerType>());
    const [drawingMode, setDrawingMode] = useState<DrawingMode>('idle');
    const [userRoutes, setUserRoutes] = useState<UserRoute[]>([]);
    const [startCity, setStartCity] = useState<City | null>(null);
    const [routeColor, setRouteColor] = useState('#ff4d4d');
    const [attackableCities, setAttackableCities] = useState<Map<number, AttackInfo> | null>(null);
    const [markingMode, setMarkingMode] = useState<CityMarkerType | null>(null);

    const clearSelection = useCallback(() => {
        setSelectedCity(null);
        setSelectedUnion(null);
        setSelectedNation(null);
    }, []);


    useEffect(() => {
        if (selectedCity && cities.length > 0) {
            const updatedSelectedCity = cities.find(c => c.id === selectedCity.id);
            if (updatedSelectedCity) {
                setSelectedCity(updatedSelectedCity);
            }
        }
    }, [cities, selectedCity]);

    const selectCity = useCallback((city: City) => {
        clearSelection(); // Clear everything else first
        setIsAnimating(true);
        const flyToCity = () => {
            setSelectedCity(city);
            setMapView({
                center: [MAX_Y - city.y_position, city.x_position],
                zoom: -1,
            });
        };
        if (selectedCity && selectedCity.id !== city.id) {
            setSelectedCity(null);
            setTimeout(flyToCity, 300);
        } else {
            flyToCity();
        }
    }, [selectedCity, clearSelection]);

    const selectUnion = async (unionId: number) => {
        if (isFetchingDetails) return;
        setIsFetchingDetails(true);
        clearSelection();
        try {
            const data = await getUnionDetails(unionId);
            setSelectedUnion(data);
        } catch (error) {
            console.error("Failed to fetch union details:", error);
            alert("Could not retrieve union details.");
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const selectNation = async (nationId: number) => {
        if (isFetchingDetails) return;
        setIsFetchingDetails(true);
        clearSelection();
        try {
            const data = await getNationDetails(nationId);
            setSelectedNation(data);
        } catch (error) {
            console.error("Failed to fetch nation details:", error);
            alert("Could not retrieve nation details.");
        } finally {
            setIsFetchingDetails(false);
        }
    };


    const onMapViewComplete = useCallback(() => setMapView(null), []);
    const onAnimationEnd = useCallback(() => setIsAnimating(false), []);

    const setCityMarker = useCallback((cityId: number, marker: CityMarkerType | null) => {
        setCityMarkers(prev => {
            const newMarkers = new Map(prev);
            if (marker) {
                newMarkers.set(cityId, marker);
            } else {
                newMarkers.delete(cityId);
            }
            return newMarkers;
        });
    }, []);

    const addUserRoute = useCallback((route: Omit<UserRoute, 'id'>) => {
        setUserRoutes(prev => [...prev, { ...route, id: crypto.randomUUID() }]);
    }, []);

    const removeUserRoute = useCallback((routeId: string) => {
        setUserRoutes(prev => prev.filter(r => r.id !== routeId));
    }, []);

    const value = {
        selectedCity, selectedUnion, selectedNation, isFetchingDetails,
        mapView, isAnimating,
        selectCity, selectUnion, selectNation, clearSelection,
        onMapViewComplete, onAnimationEnd,
        cityMarkers, setCityMarker,
        drawingMode, setDrawingMode,
        userRoutes, addUserRoute, removeUserRoute,
        startCity, setStartCity,
        routeColor, setRouteColor,
        attackableCities, setAttackableCities,
        markingMode, setMarkingMode,
    };

    return (
        <UserInteractionContext.Provider value={value}>
            {children}
        </UserInteractionContext.Provider>
    );
};

export const useUserInteraction = () => {
    const context = useContext(UserInteractionContext);
    if (context === undefined) {
        throw new Error('useUserInteraction must be used within a UserInteractionProvider');
    }
    return context;
};