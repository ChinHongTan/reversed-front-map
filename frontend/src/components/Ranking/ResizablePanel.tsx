import React, { useState, useCallback, useRef, ReactNode } from 'react';
import './ResizablePanel.css';

interface ResizablePanelProps {
    children: ReactNode;
    isVisible: boolean;
    initialWidth?: number;
    minWidth?: number;
    maxWidth?: number;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
                                                           children,
                                                           isVisible,
                                                           initialWidth = 220,
                                                           minWidth = 150,
                                                           maxWidth = 500,
                                                       }) => {
    const [width, setWidth] = useState(initialWidth);
    const isResizing = useRef(false);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing.current) {
            const newWidth = document.documentElement.clientWidth - e.clientX;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        }
    }, [minWidth, maxWidth]);

    return (
        <div className={`resizable-panel-container ${isVisible ? 'is-visible' : ''}`} style={{ width: `${width}px` }}>
            <div className="resizer" onMouseDown={handleMouseDown} />
            <div className="resizable-panel-content">
                {children}
            </div>
        </div>
    );
};

export default ResizablePanel;