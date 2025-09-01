import { LatLngTuple } from "leaflet";

export const HISTORY_STORAGE_KEY = "map-tool-search-history";

// Map Dimensions
export const MAX_X = 10516;
export const MAX_Y = 7023;
export const mapBounds: [LatLngTuple, LatLngTuple] = [
	[0, 0],
	[MAX_Y + 480, MAX_X + 530],
];
export const MAX_MAP_BOUNDS: [LatLngTuple, LatLngTuple] = [
    [-1500, -1600],
    [7023 + 1500, 10516 + 1600],
];

// Game-specific Mappings
export const NATION_CODE_MAP: { [key: string]: string } = {
	'臺灣': 'TW', '蒙古': 'MG', '香港': 'HK', '反賊聯盟': 'RB', '紅軍': 'CM',
	'滿洲': 'MC', '藏國': 'TB', '哈薩克': 'KZ', '維吾爾': 'UG',
};

// Reward definitions for the InfoPanel
export const REWARD_META: { [key: string]: { name: string; color: string } } = {
    Money: { name: "動員力", color: "money" },
    Energy: { name: "能量石", color: "energy" },
    R1: { name: "紅1 (汽油)", color: "r" },
    R2: { name: "紅2 (彈匣)", color: "r" },
    R3: { name: "紅3 (炸藥)", color: "r" },
    Y1: { name: "黃1 (信用)", color: "y" },
    Y2: { name: "黃2 (人脈)", color: "y" },
    Y3: { name: "黃3 (基金)", color: "y" },
    B1: { name: "藍1 (傳單)", color: "b" },
    B2: { name: "藍2 (書刊)", color: "b" },
    B3: { name: "藍3 (傳媒)", color: "b" },
    G1: { name: "綠1 (線報)", color: "g" },
    G2: { name: "綠2 (內應)", color: "g" },
    G3: { name: "綠3 (地下黨)", color: "g" },
};