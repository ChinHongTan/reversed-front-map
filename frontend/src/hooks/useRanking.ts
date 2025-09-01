import { useMemo } from 'react';
import { City, Nation, RankItem } from '../types';
import { hexToRgba } from '../utils/colors';

/**
 * 自定义 Hook 用于计算国家和联盟的排名
 * @param cities - 城市列表
 * @param nations - 国家列表
 * @returns 包含国家和联盟排名的对象
 */
export const useRanking = (cities: City[], nations: Nation[]) => {
	const { nationRanks, unionRanks } = useMemo(() => {
		const nationCityCount = new Map<number, number>();
		const unionCityCount = new Map<
			number,
			{ count: number; union: { id: number; name: string; nation_id: number } }
		>();

		for (const city of cities) {
			if (city.control_nation) {
				const nationId = city.control_nation.id;
				nationCityCount.set(
					nationId,
					(nationCityCount.get(nationId) || 0) + 1
				);
			}
			if (city.control_union) {
				const unionId = city.control_union.id;
				const current = unionCityCount.get(unionId) || {
					count: 0,
					union: city.control_union,
				};
				current.count++;
				unionCityCount.set(unionId, current);
			}
		}

		const calculatedNationRanks: RankItem[] = Array.from(
			nationCityCount.entries()
		)
			.map(([id, count]) => {
				const nation = nations.find((n) => n.id === id);
				return {
					id,
					name: nation?.name || "Unknown",
					count,
					color: hexToRgba(nation?.city_color || "888888", 0.6),
				};
			})
			.sort((a, b) => a.id - b.id);

		const calculatedUnionRanks: RankItem[] = Array.from(unionCityCount.values())
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)
			.map((item) => {
				const nation = nations.find((n) => n.id === item.union.nation_id);
				return {
					id: item.union.id,
					name: item.union.name,
					count: item.count,
					color: hexToRgba(nation?.city_color || "888888", 0.4),
				};
			});

		return {
			nationRanks: calculatedNationRanks,
			unionRanks: calculatedUnionRanks,
		};
	}, [cities, nations]);

	return { nationRanks, unionRanks };
};