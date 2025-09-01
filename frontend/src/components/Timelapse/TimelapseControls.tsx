import React, {useRef} from "react";
import {FaPlay, FaPause, FaDownload} from "react-icons/fa";
import "./TimelapseControls.css";
import {API_URL} from "../../config";

interface TimelapseControlsProps {
	isPlaying: boolean;
	onPlayPause: () => void;
	onScrub: (eventIndex: number) => void;
	maxIndex: number;
	currentIndex: number;
	currentDate: string;
	onSpeedChange: (speed: number) => void;
	currentSpeed: number;
	availableDates: string[];
	selectedDate: string | null;
	onDateChange: (date: string) => void;
}

const speeds = [1, 2, 4, 8, 16, 32, 64]; // 播放速度

const TimelapseControls: React.FC<TimelapseControlsProps> = ({
	isPlaying,
	onPlayPause,
	onScrub,
	maxIndex,
	currentIndex,
	currentDate,
	onSpeedChange,
	currentSpeed,
	availableDates,
	selectedDate,
	onDateChange,
}) => {
	useRef<HTMLInputElement>(null);
	const handleExportClick = () => {
		if (selectedDate) {
			window.open(`${API_URL}/api/timelapse/export?date=${selectedDate}`, '_blank');
		}
	};

	return (
		<div className="timelapse-controls-container">
			<button
				onClick={handleExportClick}
				className="play-pause-btn"
				title="導出本日戰報"
				disabled={!selectedDate || selectedDate === "Imported File"} // 當是導入檔案時，禁用導出按鈕
			>
				<FaDownload />
			</button>

			<div className="date-selector-container">
				<label htmlFor="date-select">選擇日期:</label>
				<select
					id="date-select"
					value={selectedDate || ''}
					onChange={(e) => onDateChange(e.target.value)}
					disabled={availableDates.length === 0}
				>
					{/* 如果 selectedDate 是導入檔案，也顯示它 */}
					{selectedDate === "Imported File" && <option value="Imported File">Imported File</option>}
					{availableDates.map(date => (
						<option key={date} value={date}>{date}</option>
					))}
				</select>
			</div>

			<button onClick={onPlayPause} className="play-pause-btn">
				{isPlaying ? <FaPause /> : <FaPlay />}
			</button>
			<div className="timeline-date">{currentDate}</div>
			<input
				type="range"
				min={0}
				max={maxIndex}
				value={currentIndex}
				onChange={(e) => onScrub(parseInt(e.target.value, 10))}
				className="timeline-slider"
			/>
			<div className="speed-controls">
				{speeds.map((speed) => (
					<button
						key={speed}
						className={`speed-btn ${
							currentSpeed === speed ? "active" : ""
						}`}
						onClick={() => onSpeedChange(speed)}
					>
						{speed}x
					</button>
				))}
			</div>
		</div>
	);
};

export default TimelapseControls;
