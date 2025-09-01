import React, { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { RankItem } from '../../types';
import { useRanking } from '../../hooks/useRanking';
import { useMapData } from '../../context/MapContext';
import { useUIView } from '../../context/UIViewContext';
import './RankingPanel.css';

interface RankedListProps {
    title: string;
    items: RankItem[];
    onItemClick?: (id: number | string) => void;
    isExpanded: boolean;
    onToggle: () => void;
}

const RankedList: React.FC<RankedListProps> = ({ title, items, onItemClick, isExpanded, onToggle }) => {
    return (
        <div className="rank-list">
            <h4 onClick={onToggle} className="collapsible">
                {title}
                <FaChevronDown className={`chevron-icon ${isExpanded ? 'expanded' : ''}`} />
            </h4>
            <div className={`list-container ${isExpanded ? 'expanded' : ''}`}>
                {items.map(item => (
                    <div
                        key={item.id}
                        className={`rank-item ${onItemClick ? 'clickable' : ''}`}
                        style={{ backgroundColor: item.color }}
                        onClick={() => onItemClick && onItemClick(item.id)}
                    >
                        <div className="rank-name">{item.name}</div>
                        <div className="rank-count">{item.count.toLocaleString()} 城</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface RankingPanelProps {
    onUnionClick: (id: number) => void;
    onNationClick: (id: number) => void;
}

const RankingPanel: React.FC<RankingPanelProps> = ({ onUnionClick, onNationClick }) => {
    // Hooks are used internally to get data and calculate ranks
    const { cities, nations } = useMapData();
    const { isTimelapseMode } = useUIView();
    const { nationRanks, unionRanks } = useRanking(cities, nations);

    const [isNationListExpanded, setIsNationListExpanded] = useState(true);
    const [isUnionListExpanded, setIsUnionListExpanded] = useState(true);

    const toggleNationList = () => setIsNationListExpanded(!isNationListExpanded);
    const toggleUnionList = () => setIsUnionListExpanded(!isUnionListExpanded);

    return (
        <div className="ranking-panel-container">
            <RankedList
                title="勢力排行榜"
                items={nationRanks}
                onItemClick={(id) => onNationClick(id as number)}
                isExpanded={isNationListExpanded}
                onToggle={toggleNationList}
            />

            {!isTimelapseMode && (
                <RankedList
                    title="聯盟排行榜 (前10)"
                    items={unionRanks}
                    onItemClick={(id) => onUnionClick(id as number)}
                    isExpanded={isUnionListExpanded}
                    onToggle={toggleUnionList}
                />
            )}
        </div>
    );
};

export default RankingPanel;