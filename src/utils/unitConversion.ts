import { DISPLAY_PRECISION } from './precision';

export type UnitSystem = 'metric' | 'imperial';

export function metersToDistance(meters: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    return `${feet.toFixed(DISPLAY_PRECISION)} ft`;
  }
  return `${meters.toFixed(DISPLAY_PRECISION)} m`;
}

export function speedToDisplay(speedMs: number, units: UnitSystem): string {
  if (units === 'imperial') {
    const mph = speedMs * 2.237; // m/s to mph
    return `${mph.toFixed(DISPLAY_PRECISION)} mph`;
  }
  return `${speedMs.toFixed(DISPLAY_PRECISION)} m/s`;
}

export function convertValue(
  value: number,
  fromUnit: 'meters' | 'ms',
  toUnit: UnitSystem
): number {
  if (toUnit === 'imperial') {
    if (fromUnit === 'meters') {
      return value * 3.28084; // meters to feet
    } else if (fromUnit === 'ms') {
      return value * 2.237; // m/s to mph
    }
  }
  return value;
}

export function getUnitLabel(type: 'distance' | 'speed', units: UnitSystem): string {
  if (units === 'imperial') {
    return type === 'distance' ? 'ft' : 'mph';
  }
  return type === 'distance' ? 'm' : 'm/s';
}
