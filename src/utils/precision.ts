// Google Maps style: 5 decimal places = ~1.1m accuracy (close to 1cm local coordinates)
// Maintains 1cm accuracy for navigation while reducing visual clutter
export const DISPLAY_PRECISION = 5;

export function round6(value: number): number {
  // Internal: keep 6 decimals for calculations (11cm precision)
  return Math.round(value * 1e6) / 1e6;
}

export function roundDisplay(value: number): number {
  // Display: round to DISPLAY_PRECISION (5 decimals) for Google Maps style
  const factor = Math.pow(10, DISPLAY_PRECISION);
  return Math.round(value * factor) / factor;
}
