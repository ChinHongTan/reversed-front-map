import React from 'react';
import { FaHistory } from 'react-icons/fa';
import { City } from '../../types';
import './SearchHistory.css';

interface SearchHistoryProps {
    history: City[];
    onCitySelect: (city: City) => void;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onCitySelect }) => {
    if (!Array.isArray(history) || history.length === 0) {
        return (
            <div className="history-item-empty">
                <span>No recent history.</span>
            </div>
        );
    }

    return (
        <div className="search-history-list">
            {history.map(city => (
                <div key={`hist-${city.id}`} className="history-item" onClick={() => onCitySelect(city)}>
                    <FaHistory className="history-icon" />
                    <span>{city.name}</span>
                </div>
            ))}
        </div>
    );
};

export default SearchHistory;