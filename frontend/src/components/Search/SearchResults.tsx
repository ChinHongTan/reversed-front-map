import React from 'react';
import { City } from '../../types';
import './SearchResults.css';

interface SearchResultsProps {
    results: City[];
    onCitySelect: (city: City) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onCitySelect }) => {
    if (results.length === 0) {
        return null;
    }

    return (
        <div className="search-results-list">
            {results.map(city => (
                <div key={city.id} className="result-item" onClick={() => onCitySelect(city)}>
                    <span className="result-item-name">{city.name}</span>
                    <span className="result-item-nation">{city.control_nation?.name || 'Uncontrolled'}</span>
                </div>
            ))}
        </div>
    );
};

export default SearchResults;