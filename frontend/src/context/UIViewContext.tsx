import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type RightPanel = 'ranking' | 'tactical' | 'none';

interface UIViewState {
    isPathsVisible: boolean;
    isAirRoutesVisible: boolean;
    isTimelapseMode: boolean;
    isVoronoiVisible: boolean;
    isTacticalMode: boolean;
    activeRightPanel: RightPanel;
    togglePaths: () => void;
    toggleAirRoutes: () => void;
    toggleVoronoi: () => void;
    toggleTacticalMode: () => void;
    toggleRankingPanel: () => void;
    toggleTacticalPanel: () => void;
    enterTimelapse: () => void;
    exitTimelapse: () => void;
    setActiveRightPanel: (panel: RightPanel) => void;
}

const UIViewContext = createContext<UIViewState | undefined>(undefined);

export const UIViewProvider = ({ children }: { children: ReactNode }) => {
    const [isPathsVisible, setIsPathsVisible] = useState(true);
    const [isAirRoutesVisible, setIsAirRoutesVisible] = useState(false);
    const [isTimelapseMode, setIsTimelapseMode] = useState(false);
    const [isVoronoiVisible, setIsVoronoiVisible] = useState(true);
    const [isTacticalMode, setIsTacticalMode] = useState(false);
    const [activeRightPanel, setActiveRightPanel] = useState<RightPanel>('ranking');

    const togglePaths = useCallback(() => setIsPathsVisible(prev => !prev), []);
    const toggleAirRoutes = useCallback(() => setIsAirRoutesVisible(prev => !prev), []);
    const toggleVoronoi = useCallback(() => setIsVoronoiVisible(prev => !prev), []);
    const toggleTacticalMode = useCallback(() => setIsTacticalMode(prev => !prev), []);
    const enterTimelapse = useCallback(() => setIsTimelapseMode(true), []);
    const exitTimelapse = useCallback(() => setIsTimelapseMode(false), []);

    const toggleRankingPanel = () => {
        setActiveRightPanel(prev => prev === 'ranking' ? 'none' : 'ranking');
    };

    const toggleTacticalPanel = () => {
        setActiveRightPanel(prev => prev === 'tactical' ? 'none' : 'tactical');
    };

    const value = {
        isPathsVisible,
        isAirRoutesVisible,
        isTimelapseMode,
        isVoronoiVisible,
        isTacticalMode,
        activeRightPanel,
        togglePaths,
        toggleAirRoutes,
        toggleVoronoi,
        toggleTacticalMode,
        enterTimelapse,
        exitTimelapse,
        toggleRankingPanel,
        toggleTacticalPanel,
        setActiveRightPanel,
    };

    return <UIViewContext.Provider value={value}>{children}</UIViewContext.Provider>;
};

export const useUIView = () => {
    const context = useContext(UIViewContext);
    if (context === undefined) {
        throw new Error('useUIView must be used within a UIViewProvider');
    }
    return context;
};