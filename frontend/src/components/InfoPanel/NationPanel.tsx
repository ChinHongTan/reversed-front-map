import {hexToRgba} from "../../utils/colors";
import {FaLandmark, FaUserTie} from "react-icons/fa";
import DetailItem from "./DetailItem";
import {MdChatBubbleOutline, MdFormatQuote} from "react-icons/md";
import {GiPublicSpeaker} from "react-icons/gi";
import React from "react";
import {useUserInteraction} from "../../context/UserInteractionContext";

interface NationPanelProps {
    onUnionClick: (unionId: number) => void;
    onCityJump: (cityId: number) => void;
}

export const NationPanel: React.FC<NationPanelProps> = ({ onUnionClick, onCityJump }) => {
    const { selectedNation: nation } = useUserInteraction();
    if (!nation) return null;

    const panelColor = hexToRgba(nation.city_color, 0.3);

    return (
        <div className="info-panel-content" style={{ borderColor: `#${nation.city_color}` }}>
            <div className="info-header">
                <h2>{nation.name}</h2>
                <p className="panel-subtitle">{nation.title}</p>
            </div>

            <div className="info-section" style={{ backgroundColor: panelColor }}>
                <h4><FaLandmark /> 核心資訊</h4>
                <DetailItem label="首都" value={nation.capital.name} onClick={() => onCityJump(nation.capital.id)} />
                <DetailItem label="城市總數" value={nation.control_cities} />
                <DetailItem label="玩家人數" value={nation.players} />
            </div>

            {nation.commander && (
                <div className="info-section" style={{ backgroundColor: panelColor }}>
                    <h4><FaUserTie /> 總指揮</h4>
                    <DetailItem
                        label={nation.commander.name}
                        value={nation.commander.union}
                        onClick={() => {
                            if (nation.commander?.union_id) {
                                onUnionClick(nation.commander.union_id);
                            }
                        }}
                    />
                </div>
            )}

            <div className="info-section" style={{ backgroundColor: panelColor }}>
                <h4><MdFormatQuote /> 標語</h4>
                <div className="quote-block">
                    {nation.slogan.map((line, i) => <p key={i}>"{line}"</p>)}
                </div>
            </div>

            <div className="info-section" style={{ backgroundColor: panelColor }}>
                <h4><MdChatBubbleOutline /> 指揮官的話</h4>
                <div className="quote-block commander-words">
                    {nation.commander_words && nation.commander_words.length > 0 ? (
                        nation.commander_words.map((line, i) => <p key={i}>"{line}"</p>)
                    ) : (
                        <p>無</p>
                    )}
                </div>
            </div>

            <div className="info-section" style={{ backgroundColor: panelColor }}>
                <h4><GiPublicSpeaker /> 內閣部門</h4>
                <div className="ministers-list">
                    {nation.ministers.map((min) => (
                        <DetailItem
                            key={min.ministry.id}
                            label={min.ministry.name}
                            value={min.minister || '(懸缺)'}
                            onClick={() => {
                                if (min.minister_union_id) {
                                    onUnionClick(min.minister_union_id);
                                }
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}