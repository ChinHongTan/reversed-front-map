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
  control_union?: { id: number; name: string, nation_id: number };
  sovereign?: string;
  sword?: boolean;
  nation_battle_score?: string | null;
  nation_battle?: NationBattle;
  knife_clickable?: boolean;
  npc?: string[];
  rewards?: { [key: string]: number };
}

export interface CityDetails {
    [cityId: string]: {
        npc?: string[];
        rewards?: { [key: string]: number };
    };
}

export interface Path {
  from: number;
  to: number;
  type: 'rail' | 'road' | 'air' | 'sea';
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
    name: string; // e.g. "保防處"
  };
}

export interface Nation {
  id: number;
  name: string;
  title: string;
  description: string;
  city_color: string; // e.g. "fd1e19"
  capital: Capital;
  control_cities: number; // 当前控制的城市数量
  players: number; // 玩家数量
  cities: number; // 主权城市数量 (有NPC)
  commander?: Commander;
  commander_words?: string[];
  slogan: string[];
  general_strategy_ids?: number[];
  candidates?: any[]; // 暫時沒用
  ministers: Minister[];
}

export interface NationsResponse {
  nations: Nation[];
  diplomatic_strategies?: any[];
  general_strategies?: any[];
  all?: any;
}

export interface CitiesResponse {
  cities: City[];
}

export interface UnionsResponse {
  unions: Union[];
}

export interface PhoenixUpdate {
  cities?: Partial<City>[];
  unions?: Partial<Union>[];
  nations?: Partial<Nation>[];
}

export interface WebSocketMessage {
    type: string;
    payload: any;
}

export interface RankItem {
  id: number | string;
  name: string;
  count: number;
  color: string;
}

export interface AttackInfo {
    maxPower: number;
    minHops: number;
}

interface MoveToCityInfo {
  at: string;
  id: number;
  name: string;
}

interface UnionOfficer {
  authority: number | null;
  half_image: string;
  image: string;
  locale: string;
  name: string;
  title: string | null;
  user_id: number;
}

export interface UnionData {
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
  officers: UnionOfficer[];
  power: number;
  random_pick: boolean;
  ranking_image: string;
  room_id: any | null;
  show_union_channel: boolean;
  undo_dissolvable: boolean;
}