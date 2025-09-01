import React, {ReactNode} from 'react';
import { FaCrosshairs, FaShieldAlt, FaStar, FaTrash } from 'react-icons/fa';
import { useUserInteraction } from '../../context/UserInteractionContext';
import { useMapData } from '../../context/MapContext';
import { CityMarkerType } from '../../context/UserInteractionContext';
import { useUIView } from '../../context/UIViewContext';
import '../Ranking/RankingPanel.css';
import './TacticalDashboard.css';

// 定義標記類型的圖示和標題
const MARKER_META: { [key in CityMarkerType]: { icon: React.ReactNode; title: string } } = {
    'attack': { icon: <FaCrosshairs />, title: '進攻目標' },
    'defend': { icon: <FaShieldAlt />, title: '防禦要點' },
    'priority': { icon: <FaStar />, title: '優先關注' },
};

interface TacticalDashboardProps {
    onCityJump: (cityId: number) => void;
}

interface TabButtonProps {
    type: CityMarkerType;
    children: ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ type, children }) => {
    const { markingMode, setMarkingMode } = useUserInteraction();
    const { setActiveRightPanel } = useUIView();
    const isActive = markingMode === type;

    const handleClick = () => {
        // 如果點擊的是當前 active 的按鈕，則取消 markingMode
        if (isActive) {
            setMarkingMode(null);
        } else {
            // 否則，設定 markingMode，並確保戰術面板是打開的
            setMarkingMode(type);
            setActiveRightPanel('tactical');
        }
    };

    return (
        <button className={`tab-button ${isActive ? 'active' : ''}`} onClick={handleClick}>
            {children}
        </button>
    );
};

const TacticalDashboard: React.FC<TacticalDashboardProps> = ({ onCityJump }) => {
    const { cityMarkers, setCityMarker, markingMode } = useUserInteraction();
    const { cities } = useMapData();
    const { isTacticalMode, toggleTacticalMode } = useUIView();

    const cityIdToNameMap = React.useMemo(() =>
            new Map(cities.map(c => [c.id, c.name])),
        [cities]);

    const activeCities = React.useMemo(() => {
        if (!markingMode) return [];
        const ids = [];
        for (const [cityId, markerType] of cityMarkers.entries()) {
            if (markerType === markingMode) {
                ids.push(cityId);
            }
        }
        return ids;
    }, [cityMarkers, markingMode]);

    const handleClearAll = () => {
        if (window.confirm('確定要清除所有戰術標記嗎？')) {
            cityMarkers.forEach((_, cityId) => setCityMarker(cityId, null));
        }
    };

    return (
        <div className="tactical-dashboard-shell">
            <div className="tactical-dashboard-header">
                <div className="info-header">
                    <h2>戰術目標</h2>
                    <button className={`action-btn ${isTacticalMode ? 'active' : ''}`} onClick={toggleTacticalMode}>
                        戰術視圖
                    </button>
                </div>
                <div className="tab-controls">
                    <TabButton type="attack"><FaCrosshairs /> 進攻</TabButton>
                    <TabButton type="defend"><FaShieldAlt /> 防禦</TabButton>
                    <TabButton type="priority"><FaStar /> 優先</TabButton>
                </div>
            </div>

            <div className="tactical-dashboard-content">
                {markingMode && activeCities.length > 0 ? (
                    activeCities.map(cityId => (
                        <div key={cityId} className="detail-item-pill clickable" onClick={() => onCityJump(cityId)}>
                            <div className="detail-left">
                                <span className="detail-name">{cityIdToNameMap.get(cityId) || `ID: ${cityId}`}</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setCityMarker(cityId, null); }}
                                style={{ background: 'none', border: 'none', color: '#ff7875', cursor: 'pointer' }}
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="history-item-empty">
                        {markingMode ? `沒有標記為 "${MARKER_META[markingMode].title}" 的城市` : '請選擇一種標記模式'}
                    </div>
                )}
            </div>

            {cityMarkers.size > 0 && (
                <div className="info-section">
                    <button className="action-btn clear" style={{width: '100%'}} onClick={handleClearAll}>
                        <FaTrash /> 全部清除
                    </button>
                </div>
            )}
        </div>
    );
};

export default TacticalDashboard;