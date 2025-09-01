import React, {useEffect, useRef, useState} from "react";
import "./App.css";

// ---- Context hooks ----
import {useMapData} from "./context/MapContext";
import {useUserInteraction} from "./context/UserInteractionContext";
import {useUIView} from "./context/UIViewContext";
import {useSearch} from "./context/SearchContext";
import { useMediaQuery } from "./hooks/useMediaQuery";

// ---- Components ----
import InfoPanel from "./components/InfoPanel/InfoPanel";
import SearchBar from "./components/Search/SearchBar";
import SearchHistory from "./components/Search/SearchHistory";
import SearchResults from "./components/Search/SearchResults";
import TimelapseView from "./components/Timelapse/TimelapseView";
import MapView from "./components/Map/MapView";
import Toolbar, {ToolbarButtonConfig} from "./components/common/Toolbar";
import ResizablePanel from "./components/Ranking/ResizablePanel";
import TacticalDashboard from "./components/InfoPanel/TacticalDashboard";
import BottomTabBar from "./components/common/BottomTabBar";
import BottomSheet from "./components/common/BottomSheet";

// ---- Types and Constants ----
import {City} from "./types";
import {HISTORY_STORAGE_KEY} from "./constants";
import {API_URL} from "./config";
import {FaBraille, FaBullseye, FaHistory, FaLayerGroup, FaPlane, FaRoute, FaUpload} from "react-icons/fa";
import RankingPanel from "./components/Ranking/RankingPanel";
import { AnimatePresence } from "framer-motion";

interface ImportedTimelapseData {
    initialCities: City[];
    events: any[];
}

const MorePanel = ({ buttons }: { buttons: ToolbarButtonConfig[] }) => (
    <div className="more-panel">
        <h4>更多選項</h4>
        <div className="more-panel-grid">
            {buttons.map(btn => (
                <button
                    key={btn.id}
                    className={`toolbar-button ${btn.isActive ? "is-active" : ""}`}
                    onClick={btn.onClick}
                >
                    {btn.icon}
                    <span>{btn.label}</span>
                </button>
            ))}
        </div>
    </div>
);

function App() {
    // --- Context Hooks ---
    const {cities, isLoading} = useMapData();
    const ui = useUIView();
    const search = useSearch();

    // --- Logic Hooks ---
    const {
        selectCity,
        selectUnion,
        selectNation,
        clearSelection,
        setDrawingMode,
        setStartCity,
        drawingMode,
        selectedCity,
        selectedUnion,
        selectedNation,
    } = useUserInteraction();

    // --- Mobile UI ---
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetContent, setSheetContent] = useState<'ranking' | 'tactical' | 'more' | 'info' | 'search'>('ranking');

    // Media query for mobile devices
    const isDesktop = useMediaQuery('(min-width: 1024px)');


    // --- Local State ---
    const [availableTimelapseDates, setAvailableTimelapseDates] = useState<string[]>([]);
    const [importedData, setImportedData] = useState<ImportedTimelapseData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- Effects ---
    useEffect(() => {
        fetch(`${API_URL}/api/timelapse/logs`)
            .then((res) => res.json())
            .then(setAvailableTimelapseDates)
            .catch(() => setAvailableTimelapseDates([]));
    }, []);

    useEffect(() => {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(search.history));
    }, [search.history]);


    // --- Event Handlers ---
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const jsonData = JSON.parse(content);
                    if (jsonData.initialCities && jsonData.events) {
                        setImportedData(jsonData);
                        ui.enterTimelapse();
                    } else {
                        alert("Import failed: File is missing 'initialCities' or 'events'.");
                    }
                } catch (error) {
                    console.error("Error parsing imported file:", error);
                    alert("Import failed: Invalid file format.");
                }
            };
            reader.readAsText(file);
        }
        if (event.target) event.target.value = '';
    };

    const handleEnterTimelapse = () => {
        if (availableTimelapseDates.length > 0) {
            setImportedData(null);
            ui.enterTimelapse();
        } else {
            alert("No historical data available in the database.\nYou can import a local file using the 'Import' button.");
        }
    };

    const handleCollapseAll = () => {
        search.collapse();
        clearSelection();
        setDrawingMode('idle');
        setStartCity(null);
    };

    const handleCitySelect = (city: City) => {
        search.handleCitySelection(city);
        selectCity(city);
        search.activate({ showDropdown: false });
    };

    const handleJumpToCity = (cityId: number) => {
        const city = cities.find(c => c.id === cityId);
        if (city) {
            selectCity(city);
            search.activate({ showDropdown: false });
        }
    };

    const handleUnionSelect = async (unionId: number) => {
        await selectUnion(unionId);
        search.activate({ showDropdown: false });
    };

    const handleNationSelect = async (nationId: number) => {
        await selectNation(nationId);
        search.activate({ showDropdown: false });
    };

    const handleMapClick = () => {
        if (search.isActive || selectedCity || selectedUnion || selectedNation) {
            handleCollapseAll();
        }
    };

    const handlePlanRouteClick = () => {
        if (drawingMode === 'idle') {
            setDrawingMode('route_start');
        } else {
            setDrawingMode('idle');
            setStartCity(null);
        }
    };

    // --- Toolbar Button Configurations ---
    const mainToolbarButtons: ToolbarButtonConfig[] = [
        {
            id: 'air-routes',
            icon: <FaPlane/>,
            label: '航線',
            isActive: ui.isAirRoutesVisible,
            onClick: ui.toggleAirRoutes,
            title: 'Toggle Air Routes'
        },
        {
            id: 'paths',
            icon: <FaRoute/>,
            label: '路綱',
            isActive: ui.isPathsVisible,
            onClick: ui.togglePaths,
            title: 'Toggle Paths'
        },
        {id: 'import', icon: <FaUpload/>, label: '導入戰報', onClick: handleImportClick, title: '導入戰報檔案'},
        {id: 'timelapse', icon: <FaHistory/>, label: '縮時戰報', onClick: handleEnterTimelapse, title: 'View History'},
        {
            id: 'ranking',
            icon: <FaLayerGroup/>,
            label: '排名',
            isActive: ui.activeRightPanel === 'ranking',
            onClick: ui.toggleRankingPanel,
            title: 'Toggle Ranking Panel'
        },
        {
            id: 'plan-route',
            icon: <FaRoute/>,
            label: '規劃路線',
            isActive: drawingMode !== 'idle',
            onClick: handlePlanRouteClick,
            title: 'Plan Route'
        },
        {
            id: 'voronoi',
            icon: <FaBraille/>,
            label: '2D 模式',
            isActive: ui.isVoronoiVisible,
            onClick: ui.toggleVoronoi,
            title: 'Toggle Territory View'
        },
        {
            id: 'tactical',
            icon: <FaBullseye/>,
            label: '戰術',
            isActive: ui.activeRightPanel === 'tactical',
            onClick: ui.toggleTacticalPanel,
            title: '戰術目標'
        },
    ];

    const moreMenuButtons = mainToolbarButtons.filter(btn =>
        !['ranking', 'tactical'].includes(btn.id)
    ); // Filter out buttons that have a dedicated tab

    // --- Mobile Handlers ---

    const [activeView, setActiveView] = useState<'map' | 'ranking' | 'timelapse'>('map');

    const handleTabClick = (view: 'map' | 'ranking' | 'timelapse') => {
        if (view === 'timelapse') {
            ui.enterTimelapse();
            return;
        }
        // If exiting timelapse, handle it
        if (ui.isTimelapseMode) {
            ui.exitTimelapse();
        }

        setActiveView(view);
        // If switching to map or ranking, close any open info sheet
        setIsSheetOpen(false);
    };

    const openSheet = (content: typeof sheetContent) => {
        setSheetContent(content);
        setIsSheetOpen(true);
    };

    const handleCitySelectMobile = (city: City) => {
        if (!city) return;

        selectCity(city);
        openSheet('info'); // Open info panel in the sheet
    };

    // --- Render Logic ---
    if (isLoading) {
        return <div className="loading-screen">正在加載地圖數據...</div>;
    }

    if (ui.isTimelapseMode) {
        return (
            <TimelapseView
                availableDates={availableTimelapseDates}
                importedData={importedData}
            />
        );
    }

    if (isDesktop) {
        // --- Desktop View ---
        return (
            <div className="app-container">
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{display: 'none'}}
                    accept=".json"
                    onChange={handleFileChange}
                />
                <div className="main-wrapper">
                    <MapView
                        onMapClick={handleMapClick}
                        onCityClick={handleCitySelect}
                    />

                    <Toolbar buttons={mainToolbarButtons}/>

                    <ResizablePanel isVisible={ui.activeRightPanel === 'ranking'}>
                        <RankingPanel
                            onUnionClick={handleUnionSelect}
                            onNationClick={handleNationSelect}
                        />
                    </ResizablePanel>

                    <ResizablePanel isVisible={ui.activeRightPanel === 'tactical'}>
                        <TacticalDashboard onCityJump={handleJumpToCity} />
                    </ResizablePanel>

                    <div className="search-ui-container">
                        <div
                            className={`search-bar-wrapper ${search.isActive ? "is-active" : ""}`}
                            onClick={!search.isActive ? () => search.activate() : undefined}
                        >
                            <SearchBar onCollapse={handleCollapseAll} />
                        </div>
                        <div className={`search-history-container ${search.isDropdownVisible ? "is-visible" : ""}`}>
                            {search.results.length > 0 && search.query.trim() !== "" ? (
                                <SearchResults results={search.results} onCitySelect={handleCitySelect}/>
                            ) : (
                                <SearchHistory history={search.history} onCitySelect={handleCitySelect}/>
                            )}
                        </div>
                    </div>

                    <div
                        className={`info-panel-container ${(selectedCity || selectedUnion || selectedNation) ? "is-open" : ""}`}>
                        <InfoPanel
                            onClose={handleCollapseAll}
                            onUnionClick={handleUnionSelect}
                            onNationClick={handleNationSelect}
                            onCityJump={handleJumpToCity}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // --- Mobile View ---
    return (
        <div className="app-container">
            <MapView
                onMapClick={clearSelection}
                onCityClick={handleCitySelectMobile} // Use mobile-specific handler
            />

            {/* Floating Search Bar (you can build this out more) */}
            <div className="mobile-search-wrapper">
                <SearchBar onCollapse={clearSelection} />
            </div>

            <BottomTabBar
                activeView={ui.isTimelapseMode ? 'timelapse' : 'map'}
                onTabClick={handleTabClick}
                onMoreClick={() => openSheet('more')}
            />

            <AnimatePresence>
                {activeView === 'ranking' && (
                    <BottomSheet
                        isOpen={true}
                        onClose={() => setActiveView('map')}
                        snapPoints={['40%']} // Compact view
                    >
                        <RankingPanel onUnionClick={selectUnion} onNationClick={selectNation} />
                    </BottomSheet>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSheetOpen && sheetContent === 'info' && (
                    <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)}>
                        <InfoPanel
                            onClose={() => setIsSheetOpen(false)}
                            onUnionClick={handleUnionSelect}
                            onNationClick={handleNationSelect}
                            onCityJump={handleJumpToCity}
                        />
                    </BottomSheet>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isSheetOpen && sheetContent === 'more' && (
                    <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} snapPoints={['35%']}>
                        <MorePanel buttons={moreMenuButtons} />
                    </BottomSheet>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;