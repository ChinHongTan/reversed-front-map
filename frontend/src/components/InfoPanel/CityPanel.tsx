import {City} from "../../types";
import {REWARD_META} from "../../constants";
import {FaCrosshairs, FaQuestion, FaShieldAlt, FaStar, FaTrash} from "react-icons/fa";
import {hexToRgba} from "../../utils/colors";
import DetailItem from "./DetailItem";
import React, {useEffect, useState} from "react";
import {useUserInteraction} from "../../context/UserInteractionContext";
import {useMapData} from "../../context/MapContext";

interface CityPanelProps {
    city: City;
    onUnionClick: (unionId: number) => void;
}

const useBattleTimer = (city: City | null) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [battlePhase, setBattlePhase] = useState("");
    const inBattle = city?.sword === true && city?.nation_battle;

    useEffect(() => {
        if (!inBattle || !city?.nation_battle) {
            setTimeLeft(""); setBattlePhase(""); return;
        }
        const isRollCall = city.knife_clickable === true && city.nation_battle_score === null;
        const isManeuver = city.knife_clickable === false && typeof city.nation_battle_score === 'string';
        const rollCallEndTimestamp = city.nation_battle.close_roll_call_at;
        let intervalId: NodeJS.Timeout;

        if (isRollCall && rollCallEndTimestamp) {
            setBattlePhase("徵召中");
            intervalId = setInterval(() => {
                const remaining = new Date(rollCallEndTimestamp).getTime() - new Date().getTime();
                if (remaining <= 0) { setTimeLeft("00:00"); clearInterval(intervalId); }
                else {
                    const minutes = Math.floor((remaining / 1000 / 60) % 60);
                    const seconds = Math.floor((remaining / 1000) % 60);
                    setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
                }
            }, 1000);
        } else if (isManeuver && rollCallEndTimestamp) {
            setBattlePhase("移動中");
            const startTime = new Date(rollCallEndTimestamp).getTime();
            intervalId = setInterval(() => {
                const elapsed = new Date().getTime() - startTime;
                const minutes = Math.floor((elapsed / 1000 / 60) % 60);
                const seconds = Math.floor((elapsed / 1000) % 60);
                setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
            }, 1000);
        } else {
            setBattlePhase("交戰中"); setTimeLeft("");
        }
        return () => clearInterval(intervalId);
    }, [city, inBattle]);

    return { battlePhase, timeLeft };
};

export const CityPanel: React.FC<CityPanelProps> = ({ city, onUnionClick }) => {
    if (!city) return null;

    const { cityMarkers, setCityMarker } = useUserInteraction();
    const { nationCodeColorMap, codeToNationName } = useMapData();

    const { battlePhase, timeLeft } = useBattleTimer(city);

    const currentMarker = cityMarkers.get(city.id);
    const inBattle = city.sword === true && city.nation_battle;
    const hasRewards = city.rewards && Object.keys(city.rewards).length > 0;

    let attackerCode: string | null = null, attackerName: string | null = null, attackerIconUrl: string | null = null, attackerColor: string = "#888";
    if (inBattle && city.nation_battle?.nation_icon) {
        const match = city.nation_battle.nation_icon.match(/([A-Z]{2,})\d*\.png$/);
        if (match && match[1]) {
            attackerCode = match[1];
            attackerName = codeToNationName[attackerCode] || attackerCode;
            attackerIconUrl = `/icons/nation-${attackerCode}.png`;
            attackerColor = nationCodeColorMap.get(attackerCode) || "#888";
        }
    }
    const controlNationName = city.control_nation?.name;
    const controlNationCode = controlNationName ? Object.keys(codeToNationName).find(key => codeToNationName[key] === controlNationName) : null;
    const controllerColor = city.control_nation ? nationCodeColorMap.get(controlNationCode ?? "") || "#888" : "#888";
    const sovereigntyIconUrl = `/icons/sov-${city.sovereign}.webp`;
    const nationIconUrl = controlNationCode ? `/icons/nation-${controlNationCode}.png` : null;

    const renderRewardVisuals = (key: string) => {
        const meta = REWARD_META[key];
        if (!meta) return null;
        const level = parseInt(key.slice(1), 10);
        if (isNaN(level)) return <div className="reward-dots"><span className={`dot color-${meta.color}`}></span></div>;
        return <div className="reward-dots">{Array.from({ length: level }).map((_, i) => <span key={i} className={`dot color-${meta.color}`}></span>)}</div>;
    };

    return (
        <div className="info-panel-content">
            <div className="info-header"><h2>{city.name} (ID: {city.id})</h2></div>

            <div className="info-section">
                <h4>Actions</h4>
                <div className="actions-grid">
                    <button className={`action-btn ${currentMarker === 'attack' ? 'active' : ''}`} onClick={() => setCityMarker(city.id, 'attack')}><FaCrosshairs /> 進攻</button>
                    <button className={`action-btn ${currentMarker === 'defend' ? 'active' : ''}`} onClick={() => setCityMarker(city.id, 'defend')}><FaShieldAlt /> 防禦</button>
                    <button className={`action-btn ${currentMarker === 'priority' ? 'active' : ''}`} onClick={() => setCityMarker(city.id, 'priority')}><FaStar /> 優先</button>
                    {currentMarker && <button className="action-btn clear" onClick={() => setCityMarker(city.id, null)}><FaTrash /> 清除</button>}
                </div>
            </div>

            {inBattle && (
                <div className="info-section">
                    <h4>交戰狀態</h4>
                    <div className="detail-item-pill" style={{ backgroundColor: hexToRgba(attackerColor, 0.3), color: '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
                        <div className="detail-left"><span className="detail-name">進攻方</span></div>
                        <div className="detail-divider"></div>
                        <div className="detail-right">
                            {attackerIconUrl && <div className="detail-icon-space" style={{ marginRight: "12px" }}><img src={attackerIconUrl} alt={attackerName ?? "Attacker"} style={{ width: "100%", height: "100%", borderRadius: "50%" }} /></div>}
                            <span className="detail-name" style={{ fontWeight: 600 }}>{attackerName || "Unknown"}</span>
                        </div>
                    </div>
                    <div className="detail-item-pill">
                        <div className="detail-left"><span className="detail-name">{battlePhase}</span></div>
                        <div className="detail-divider"></div>
                        <div className="detail-right">
                            <span className="detail-value" style={{ color: "#ffc107", marginRight: "12px" }}>{city.nation_battle_score || "N/A"}</span>
                            {timeLeft && (<span className="detail-value">{timeLeft}</span>)}
                        </div>
                    </div>
                </div>
            )}
            <div className="info-section">
                <h4>基本資訊</h4>
                <DetailItem
                    className="controller"
                    label={city.control_nation?.name || "無"}
                    value={city.control_union?.name || "N/A"}
                    icon={nationIconUrl ? (<img src={nationIconUrl} alt="國家圖標" style={{ width: "100%", height: "100%" }} />) : (<div className="icon-placeholder"><FaQuestion /></div>)}
                    style={{ backgroundColor: hexToRgba(controllerColor, 0.3) }}
                    onClick={() => {
                        if (city.control_union?.id) {
                            onUnionClick(city.control_union.id);
                        }
                    }}
                />
                <DetailItem label="主權" value={city.sovereign || "N/A"} icon={<img src={sovereigntyIconUrl} alt="主權圖標" style={{ width: "100%", height: "100%" }} />} />
            </div>
            {city.npc && city.npc.length > 0 && (
                <div className="info-section">
                    <h4>NPC 支援</h4>
                    <div className="npc-grid">{city.npc.map((code) => (<div key={code} className="npc-item" style={{ backgroundColor: hexToRgba(nationCodeColorMap.get(code) || "#888888", 0.4), borderColor: hexToRgba(nationCodeColorMap.get(code) || "#888888", 0.8) }}>{codeToNationName[code] || code}</div>))}</div>
                </div>
            )}
            {hasRewards && (
                <div className="info-section">
                    <h4>佔領獎勵</h4>
                    <div className="rewards-list">{Object.entries(city.rewards!).map(([key, value]) => (<DetailItem key={key} label={REWARD_META[key]?.name || key} value={value.toLocaleString()} visuals={renderRewardVisuals(key)} />))}</div>
                </div>
            )}
        </div>
    );
};