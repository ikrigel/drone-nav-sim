export interface TrackPoint {
  t: number; // elapsed time in ms
  x: number; // position north/forward in meters
  y: number; // position east/right in meters
  z: number; // altitude up in meters
  heading: number; // compass heading 0-360 degrees
  speed: number; // forward speed in m/s
}

export interface FlightSession {
  id: string;
  startedAt: number; // timestamp
  endedAt: number | null;
  points: TrackPoint[];
  totalDistanceM: number;
  maxAltitudeM: number;
  durationMs: number;
}

export interface FlightSettings {
  pitchSensitivity: number; // degrees to m/s factor
  rollSensitivity: number; // degrees to m/s factor
  maxSpeed: number; // m/s
  maxClimb: number; // m/s
  deadzoneDeg: number; // degrees
}

export interface DeviceOrientationState {
  heading: number | null; // 0-360, null if unavailable
  pitch: number | null; // degrees, nose-up positive
  roll: number | null; // degrees, right-roll positive
  permissionState: 'granted' | 'denied' | 'prompt';
}

export interface FlightState {
  x: number; // meters north
  y: number; // meters east
  z: number; // meters altitude
}
