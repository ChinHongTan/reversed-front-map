import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { MapProvider } from './context/MapContext';
import { UserInteractionProvider } from './context/UserInteractionContext';
import { UIViewProvider } from './context/UIViewContext';
import reportWebVitals from './reportWebVitals';
import {SearchProvider} from "./context/SearchContext";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <MapProvider>
            <UserInteractionProvider>
                <UIViewProvider>
                    <SearchProvider>
                        <App />
                    </SearchProvider>
                </UIViewProvider>
            </UserInteractionProvider>
        </MapProvider>
    </React.StrictMode>
);

reportWebVitals();