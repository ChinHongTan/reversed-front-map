import React, { useEffect } from "react";
import { City } from "../../types";
import { useUserInteraction } from "../../context/UserInteractionContext";
import { useMapData } from "../../context/MapContext";
import "./InfoPanel.css";
import { calculateAttackRange } from "../../utils/attackRange";
import { CityPanel } from "./CityPanel";
import { NationPanel } from "./NationPanel";
import { UnionPanel } from "./UnionPanel";

interface InfoPanelProps {
    onClose: () => void;
    onUnionClick: (unionId: number) => void;
    onNationClick: (nationId: number) => void;
    onCityJump: (cityId: number) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
                                                 onClose,
                                                 onUnionClick,
                                                 onNationClick,
                                                 onCityJump,
                                             }) => {
    const { paths, cityDetails } = useMapData();
    // Get all selected items from the interaction context
    const { selectedCity, selectedUnion, selectedNation, setAttackableCities } = useUserInteraction();

    const getCityWithDetails = (city: City | null): City | null => {
        if (!city || !cityDetails[city.id]) return city;
        return { ...city, ...cityDetails[city.id] };
    };
    const selectedCityWithDetails = getCityWithDetails(selectedCity);

    useEffect(() => {
        if (selectedCity) {
            const range = calculateAttackRange(selectedCity.id, paths);
            setAttackableCities(range);
        }
        return () => {
            setAttackableCities(null);
        };
    }, [selectedCity, paths, setAttackableCities]);

    if (selectedNation) {
        return <NationPanel onUnionClick={onUnionClick} onCityJump={onCityJump} />;
    }
    if (selectedUnion) {
        return <UnionPanel onNationClick={onNationClick} onCityJump={onCityJump} />;
    }
    if (selectedCityWithDetails) {
        return <CityPanel city={selectedCityWithDetails} onUnionClick={onUnionClick} />;
    }
    return null;
};

export default InfoPanel;