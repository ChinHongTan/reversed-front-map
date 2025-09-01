import { Path } from '../types';

/**
 * Defines the result for a single attackable city.
 */
export interface AttackInfo {
    maxPower: number; // The highest possible power to attack this city
    minHops: number;  // The shortest path (in hops) to this city
}

/**
 * Calculates all reachable cities within 3 hops and their attack power.
 * @param startCityId The ID of the city to start the search from.
 * @param paths The list of all paths on the map.
 * @returns A Map where keys are attackable city IDs and values are their AttackInfo.
 */
export function calculateAttackRange(startCityId: number, paths: Path[]): Map<number, AttackInfo> {
    const adjList = new Map<number, { to: number; type: string }[]>();

    // Build an adjacency list for efficient graph traversal. Paths are bidirectional.
    for (const path of paths) {
        if (!adjList.has(path.from)) adjList.set(path.from, []);
        if (!adjList.has(path.to)) adjList.set(path.to, []);
        adjList.get(path.from)!.push({ to: path.to, type: path.type });
        adjList.get(path.to)!.push({ to: path.from, type: path.type });
    }

    const reachableCities = new Map<number, AttackInfo>();
    const queue: { cityId: number; hops: number; power: number }[] = [];
    
    // Tracks the best power found to reach a city at a specific hop count to avoid redundant checks.
    const visited = new Map<string, number>(); // Key: "cityId-hops", Value: power

    // Start the search from the source city with 100% power and 0 hops.
    queue.push({ cityId: startCityId, hops: 0, power: 100 });
    visited.set(`${startCityId}-0`, 100);

    while (queue.length > 0) {
        const { cityId, hops, power } = queue.shift()!;

        // We can only attack up to 3 cities away.
        if (hops >= 3) continue;

        const neighbors = adjList.get(cityId) || [];

        for (const neighbor of neighbors) {
            const debuff = neighbor.type === 'rail' ? 10 : 50;
            const newPower = power - debuff;
            const newHops = hops + 1;

            // If power drops to 0 or below, this path is not viable.
            if (newPower <= 0) continue;

            // Update the final results map with the best path found so far.
            const existingReachable = reachableCities.get(neighbor.to);
            if (!existingReachable || newPower > existingReachable.maxPower) {
                reachableCities.set(neighbor.to, { maxPower: newPower, minHops: newHops });
            } else if (newPower === existingReachable.maxPower && newHops < existingReachable.minHops) {
                // If power is the same, prefer the path with fewer hops.
                reachableCities.set(neighbor.to, { maxPower: newPower, minHops: newHops });
            }

            // Check if we've found a better path (more power) to this neighbor at this hop count.
            const visitedKey = `${neighbor.to}-${newHops}`;
            const bestPowerAtHops = visited.get(visitedKey) || -1;

            if (newPower > bestPowerAtHops) {
                visited.set(visitedKey, newPower);
                queue.push({ cityId: neighbor.to, hops: newHops, power: newPower });
            }
        }
    }
    
    // The start city itself is not a valid attack target.
    reachableCities.delete(startCityId);

    return reachableCities;
}