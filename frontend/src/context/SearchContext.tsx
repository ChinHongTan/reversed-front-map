import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { City } from '../types';
import {useMapData} from "./MapContext";

const HISTORY_STORAGE_KEY = "map-tool-search-history";

interface SearchState {
    query: string;
    setQuery: (query: string) => void;
    results: City[];
    history: City[];
    isActive: boolean;
    isDropdownVisible: boolean;
    activate: (options?: { showDropdown: boolean }) => void;
    collapse: () => void;
    handleCitySelection: (city: City) => void;
}

const SearchContext = createContext<SearchState | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
    const { cities } = useMapData(); // Assuming useMapData is available
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<City[]>([]);
    const [history, setHistory] = useState<City[]>([]);
    const [isActive, setIsActive] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    useEffect(() => {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
            const parsedHistory = JSON.parse(storedHistory);
            if (Array.isArray(parsedHistory)) {
                setHistory(parsedHistory);
            }
        }
    }, []);

    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        }
    }, [history]);

    useEffect(() => {
        if (query.trim() !== "" && isActive) {
            const filteredCities = cities.filter((city) =>
                city.name.toLowerCase().includes(query.toLowerCase())
            );
            setResults(filteredCities);
        } else {
            setResults([]);
        }
    }, [query, cities, isActive]);

    const addToHistory = useCallback((city: City) => {
        setHistory((prev) => {
            const updatedHistory = prev.filter((h) => h.id !== city.id);
            updatedHistory.unshift(city);
            return updatedHistory.slice(0, 10);
        });
    }, []);

    const activate = useCallback((options?: { showDropdown: boolean }) => {
        setIsActive(true);
        setIsDropdownVisible(options?.showDropdown ?? true);
    }, []);

    const collapse = useCallback(() => {
        setIsActive(false);
        setIsDropdownVisible(false);
        setQuery("");
    }, []);

    const handleCitySelection = useCallback((city: City) => {
        addToHistory(city);
        setQuery(city.name);
        setIsDropdownVisible(false);
    }, [addToHistory]);

    const value = {
        query,
        setQuery,
        results,
        history,
        isActive,
        isDropdownVisible,
        activate,
        collapse,
        handleCitySelection,
    };

    return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};