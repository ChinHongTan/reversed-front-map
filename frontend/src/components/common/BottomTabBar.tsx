import React, { ReactNode } from 'react';
import { FaMap, FaLayerGroup, FaHistory, FaEllipsisH } from 'react-icons/fa'; // Updated icons
import './BottomTabBar.css';

interface TabBarButtonProps {
    icon: ReactNode;
    label: string;
    onClick: () => void;
    isActive?: boolean;
}

const TabBarButton: React.FC<TabBarButtonProps> = ({ icon, label, onClick, isActive }) => (
    <button className={`tab-bar-button ${isActive ? 'is-active' : ''}`} onClick={onClick}>
        {icon}
        <span>{label}</span>
    </button>
);

interface BottomTabBarProps {
    activeView: 'map' | 'ranking' | 'timelapse';
    onTabClick: (view: 'map' | 'ranking' | 'timelapse') => void;
    onMoreClick: () => void;
}

const BottomTabBar: React.FC<BottomTabBarProps> = ({
                                                       activeView,
                                                       onTabClick,
                                                       onMoreClick,
                                                   }) => {
    return (
        <div className="bottom-tab-bar-container">
            <TabBarButton
                icon={<FaMap />}
                label="地圖"
                onClick={() => onTabClick('map')}
                isActive={activeView === 'map'}
            />
            <TabBarButton
                icon={<FaLayerGroup />}
                label="排行"
                onClick={() => onTabClick('ranking')}
                isActive={activeView === 'ranking'}
            />
            <TabBarButton
                icon={<FaHistory />}
                label="縮時"
                onClick={() => onTabClick('timelapse')}
                isActive={activeView === 'timelapse'}
            />
            <TabBarButton
                icon={<FaEllipsisH />}
                label="更多"
                onClick={onMoreClick}
            />
        </div>
    );
};

export default BottomTabBar;