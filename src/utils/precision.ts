export const DISPLAY_PRECISION = 6;

export function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
