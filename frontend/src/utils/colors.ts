/**
 * Converts a hex color string to an RGBA string.
 * @param hex The hex color code (e.g., "#fd1e19").
 * @param alpha The alpha transparency value (0 to 1).
 * @returns An RGBA color string.
 */
export const hexToRgba = (hex: string, alpha: number): string => {
    const cleanHex = hex.startsWith("#") ? hex : `#${hex}`;
    if (cleanHex.length !== 7) return `rgba(128, 128, 128, ${alpha})`; // fallback

    const r = parseInt(cleanHex.slice(1, 3), 16);
    const g = parseInt(cleanHex.slice(3, 5), 16);
    const b = parseInt(cleanHex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};