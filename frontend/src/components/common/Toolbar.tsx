import React, { ReactNode } from "react";
import { useUserInteraction } from "../../context/UserInteractionContext";
import "./Toolbar.css";

export interface ToolbarButtonConfig {
	id: string;
	icon: ReactNode;
	label: string;
	isActive?: boolean;
	onClick: () => void;
	title?: string;
}

interface ToolbarProps {
	buttons: ToolbarButtonConfig[];
}

const RouteColorPicker: React.FC = () => {
	const { routeColor, setRouteColor } = useUserInteraction();
	const colors = ['#ff4d4d', '#ffc107', '#52c41a', '#1890ff', '#f759ab', '#ffffff'];
	return (
		<div className="color-palette">
			{colors.map(color => (
				<button
					key={color}
					className={`color-swatch ${routeColor === color ? 'selected' : ''}`}
					style={{ backgroundColor: color }}
					onClick={() => setRouteColor(color)}
				/>
			))}
		</div>
	);
};

const Toolbar: React.FC<ToolbarProps> = ({ buttons }) => {
	const { drawingMode } = useUserInteraction();

	return (
		<div className="toolbar-container">
			{buttons.map(btn => (
				<button
					key={btn.id}
					className={`toolbar-button ${btn.isActive ? "is-active" : ""}`}
					title={btn.title || btn.label}
					onClick={btn.onClick}
				>
					{btn.icon}
					<span>{btn.label}</span>
				</button>
			))}
			{drawingMode !== 'idle' && <RouteColorPicker />}
		</div>
	);
};

export default Toolbar;