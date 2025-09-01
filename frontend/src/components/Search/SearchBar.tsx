import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useSearch } from '../../context/SearchContext';
import './SearchBar.css';

interface SearchBarProps {
    onCollapse?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onCollapse }) => { // Destructure the prop
    const { query, setQuery, activate, collapse, isActive } = useSearch();

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation();
        activate();
    }

    const handleCollapseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onCollapse) {
            onCollapse();
        } else {
            collapse();
        }
    }

    return (
        <div className="search-container">
            <FaSearch className="search-icon" />
            <input
                type="text"
                className="search-input"
                placeholder="Search Cities..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => activate()}
                onClick={handleInputClick}
            />
            {isActive && (
                <button className="collapse-button" onClick={handleCollapseClick}>
                    <FaTimes />
                </button>
            )}
        </div>
    );
};

export default SearchBar;