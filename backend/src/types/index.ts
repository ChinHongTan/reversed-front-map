export interface NationBattle {
	close_roll_call_at?: string;
	nation_icon?: string;
}

export interface City {
	id: number;
	name: string;
	x_position: number;
	y_position: number;
	control_nation?: { id: number; name: string };
	control_union?: { id: number; name: string; nation_id: number };
	sovereign?: string;
	sword?: boolean;
	nation_battle_score?: string | null;
	nation_battle?: NationBattle;
	city_spoils?: any[];
    knife_clickable?: boolean;
    npc?: string[]; // e.g., ["TW", "CM"]
    rewards?: { [key: string]: number }; // e.g., { "Money": 1000, "R1": 10 }
}

export interface Path {
	from: number;
	to: number;
	type: "rail" | "road" | "air" | "sea"; // 路径类型
}

export interface MoveToCityInfo {
	at: string;
	id: number;
	name: string;
}

export interface Officer {
	authority: number;
	half_image: string;
	image: string;
	locale: string;
	name: string;
	title: string;
	user_id: number;
}

// --- UPDATED: Union interface is now the detailed UnionData ---
export interface Union {
	active: boolean;
	city: {
		id: number;
		name: string;
	};
	confirm_dissolvable: boolean;
	control_cities: number;
	dissolvable: boolean;
	editable: boolean;
	free_join: boolean;
	id: number;
	joinable: boolean;
	leavable: boolean;
	locale: string;
	medal: {
		image: string;
		name: string;
	};
	member_cap: number;
	member_count: number;
	minister: boolean;
	move_to_city: MoveToCityInfo | null;
	move_to_city_cancellable: boolean;
	name: string;
	nation: {
		id: number;
	};
	officers: Officer[];
	power: number;
	random_pick: boolean;
	ranking_image: string;
	room_id: any | null;
	score: number;
	seal_image: string;
	show_union_channel: boolean;
	undo_dissolvable: boolean;
}

export interface Capital {
	id: number;
	name: string;
}

export interface Commander {
	flag: string;
	image: string;
	name: string;
	seal: string;
	title: string;
	union: string;
	union_id: number;
	user_id: number;
}

export interface Minister {
	image: string;
	minister: string | null; // Union name
	minister_union_id: number | null;
	ministry: {
		id: number;
		name: string; // Ministry name e.g., "保防處"
	};
}

export interface Nation {
	id: number;
	name: string;
	title: string;
	description: string;
	city_color: string; // 例如 "fd1e19"
	capital: Capital;
	control_cities: number; // 当前控制的城市数量
	players: number; // 玩家数量
	cities: number; // 主权城市数量 (有NPC)
	commander?: Commander;
	commander_words: string[];
	slogan: string[];
	general_strategy_ids?: number[];
	candidates?: any[]; // 可以定义更详细的 Candidate 类型
	ministers: Minister[];
}

export interface NationsResponse {
	nations: Nation[];
	// 可能还包含 diplomatic_strategies, general_strategies 等，如果需要处理它们
	diplomatic_strategies?: any[];
	general_strategies?: any[];
	all?: any; // “东方大陆”等信息
}

// 从 Phoenix 服务器接收的城市数据包装器
export interface CitiesResponse {
	cities: City[];
}

export interface UnionsResponse {
	unions: Union[];
}

// Phoenix 更新消息结构 (简化示例)
export interface PhoenixUpdate {
	cities?: Partial<City>[]; // 城市的部分更新
	unions?: Partial<Union>[]; // 联盟的部分更新
	nations?: Partial<Nation>[]; // 国家部分更新
}