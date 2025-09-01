import {hexToRgba} from "../../utils/colors";
import DetailItem from "./DetailItem";
import {FaCity, FaIdCard, FaMedal, FaQuestion, FaShieldAlt, FaUsers} from "react-icons/fa";
import {LuSwords} from "react-icons/lu";
import React from "react";
import {NATION_CODE_MAP} from "../../constants";
import {useUserInteraction} from "../../context/UserInteractionContext";
import {useMapData} from "../../context/MapContext";

interface UnionPanelProps {
    onNationClick: (nationId: number) => void;
    onCityJump: (cityId: number) => void;
}

export const UnionPanel: React.FC<UnionPanelProps> = ({ onNationClick, onCityJump }) => {
    const { selectedUnion: union } = useUserInteraction();
    const { nations } = useMapData()
    if (!union) return null;

    const nationNameMap = NATION_CODE_MAP

    const unionNation = nations.find(n => n.id === union.nation.id);
    const panelColor = unionNation ? hexToRgba(unionNation.city_color, 0.3) : 'rgba(0, 0, 0, 0.2)';
    const nationIconUrl = unionNation ? `/icons/nation-${nationNameMap[unionNation.name]}.png` : null;

    return (
        <div className="info-panel-content">
            <div className="info-header">
                <h2>{union.name}</h2>
            </div>
            <div className="info-section" style={{ backgroundColor: panelColor }}>
                <h4>聯盟資訊</h4>
                <DetailItem label="聯盟 ID" value={union.id} icon={<FaIdCard />} />
                <DetailItem
                    label="所屬勢力"
                    value={unionNation?.name || 'N/A'}
                    icon={nationIconUrl ? (<img src={nationIconUrl} alt={unionNation?.name} style={{ width: "100%", height: "100%" }} />) : (<FaQuestion />)}
                    onClick={() => onNationClick(union.nation.id)}
                />
                <DetailItem label="段位" value={union.medal.name} icon={<FaMedal />} />
                <DetailItem label="戰力" value={union.power.toLocaleString()} icon={<LuSwords />} />
                <DetailItem label="主力所在地" value={union.city.name} icon={<FaShieldAlt />} onClick={() => onCityJump(union.city.id)} />
                <DetailItem label="成員" value={`${union.member_count} / ${union.member_cap}`} icon={<FaUsers />} />
                <DetailItem label="控制城市" value={union.control_cities} icon={<FaCity />} />
            </div>
            <div className="info-section" style={{ backgroundColor: panelColor }}>
                <h4>幹部成員</h4>
                <div className="officers-list">
                    {union.officers.map(officer => (
                        <DetailItem key={officer.user_id} label={officer.name} value={officer?.title || "成員"} />
                    ))}
                </div>
            </div>
        </div>
    );
}