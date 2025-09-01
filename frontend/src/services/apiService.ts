import {API_URL} from '../config';
import {Nation, UnionData} from '../types';

/**
 * Fetches detailed information for a specific union from the backend.
 * @param unionId The ID of the union to fetch.
 * @returns A promise that resolves to the UnionData.
 */
export const getUnionDetails = async (unionId: number): Promise<UnionData | null> => {
    try {
        const response = await fetch(`${API_URL}/api/unions/${unionId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch union details: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in getUnionDetails:", error);
        // Re-throw the error so the component can handle it
        throw error;
    }
};

/**
 * Fetches detailed information for a specific nation from the backend.
 * @param nationId The ID of the nation to fetch.
 * @returns A promise that resolves to the Nation data.
 */
export const getNationDetails = async (nationId: number): Promise<Nation | null> => {
    try {
        const response = await fetch(`${API_URL}/api/nations/${nationId}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Failed to fetch nation details: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error in getNationDetails:", error);
        throw error;
    }
};