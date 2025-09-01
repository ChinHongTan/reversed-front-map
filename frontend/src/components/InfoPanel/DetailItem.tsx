import React from 'react';
import './InfoPanel.css';

interface DetailItemProps {
    icon?: React.ReactNode;
    label: string;
    value: string | number;
    visuals?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon, label, value, visuals, className, style, onClick }) => {
    const pillClassName = `detail-item-pill ${className || ''} ${onClick ? 'clickable' : ''}`;

    return (
        <div className={pillClassName} style={style} onClick={onClick}>
            <div className="detail-left">
                {icon && <div className="detail-icon-space">{icon}</div>}
                <span className="detail-name">{label}</span>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-right">
                {visuals && <div className="detail-visuals">{visuals}</div>}
                <span className="detail-value">{value}</span>
            </div>
        </div>
    );
};

export default DetailItem;