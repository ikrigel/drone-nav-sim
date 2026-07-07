import type { FlightState } from '../types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Normalize angle difference to [-180, 180] range.
 * Mirrors pattern from south-lebanon-map useMapRotation.ts
 */
export function normalizeAngleDelta(delta: number): number {
  let normalized = delta;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

/**
 * Derive forward speed from pitch angle.
 * Forward tilt (pitch up/positive) = forward motion
 */
export function tiltToSpeed(
  pitch: number,
  neutralPitch: number,
  sensitivity: number,
  deadzoneDeg: number,
  maxSpeed: number
): number {
  const delta = normalizeAngleDelta(pitch - neutralPitch);

  // Apply deadzone
  if (Math.abs(delta) < deadzoneDeg) {
    return 0;
  }

  // Calculate speed: positive pitch delta -> positive speed
  const speedM = delta * sensitivity;

  // Clamp to [0, maxSpeed] - no reverse
  return Math.max(0, Math.min(speedM, maxSpeed));
}

/**
 * Derive climb rate from roll angle.
 * Left roll (roll negative) = climb, right roll (roll positive) = descend
 */
export function tiltToClimbRate(
  roll: number,
  neutralRoll: number,
  sensitivity: number,
  deadzoneDeg: number,
  maxClimb: number
): number {
  const delta = normalizeAngleDelta(roll - neutralRoll);

  // Apply deadzone
  if (Math.abs(delta) < deadzoneDeg) {
    return 0;
  }

  // Calculate climb: negative roll delta (left) -> positive climb
  const climbM = -delta * sensitivity;

  // Clamp to [-maxClimb, maxClimb]
  return Math.max(-maxClimb, Math.min(climbM, maxClimb));
}

/**
 * Dead-reckoning integration step.
 * Update position based on heading, forward speed, climb rate, and time delta.
 */
export function integrateStep(
  state: FlightState,
  heading: number,
  forwardSpeed: number,
  climbRate: number,
  dtSeconds: number
): FlightState {
  const headingRad = heading * DEG_TO_RAD;

  // Planar: dx = forward * sin(heading), dy = forward * cos(heading)
  // (north-up convention: 0° = north, 90° = east)
  const dx = forwardSpeed * Math.sin(headingRad) * dtSeconds;
  const dy = forwardSpeed * Math.cos(headingRad) * dtSeconds;
  const dz = climbRate * dtSeconds;

  return {
    x: state.x + dx,
    y: state.y + dy,
    z: Math.max(0, state.z + dz), // clamp altitude >= 0
  };
}

/**
 * Calculate total distance traveled (3D Euclidean path length)
 */
export function calculateDistance(points: Array<{ x: number; y: number; z: number }>): number {
  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dz = curr.z - prev.z;
    total += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return total;
}

/**
 * Find max altitude in a track
 */
export function findMaxAltitude(points: Array<{ z: number }>): number {
  return points.length > 0 ? Math.max(...points.map(p => p.z)) : 0;
}
