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

export interface DeviceMotionState {
  accelX: number | null; // m/s² east
  accelY: number | null; // m/s² north
  accelZ: number | null; // m/s² up
  rotationRateAlpha: number | null; // deg/s (yaw)
  rotationRateBeta: number | null; // deg/s (pitch)
  rotationRateGamma: number | null; // deg/s (roll)
}

export interface CameraDistanceState {
  distance: number | null; // estimated distance to ground/object in meters
  confidence: number; // 0-1 confidence in the measurement
}

export interface DebugSettings {
  enabled: boolean;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
}

export interface AppSettings {
  fontSize: 'small' | 'medium' | 'large' | 'xl' | 'xxl';
  debug: DebugSettings;
  units: 'metric' | 'imperial';
  showCamera: boolean;
}

export interface CameraCalibration {
  focalLengthX: number; // pixels
  focalLengthY: number; // pixels
  principalPointX: number; // pixels
  principalPointY: number; // pixels
  pixelSize: number; // mm per pixel
  timestamp: number;
}

export interface OpticalFlowVector {
  x: number; // pixels
  y: number; // pixels
  magnitude: number; // pixels
  angle: number; // radians
}

export interface CameraFeature {
  id: number;
  x: number; // pixels
  y: number; // pixels
  score: number; // 0-1 confidence
  descriptor: Uint8Array;
}

export interface MovementCalculation {
  speedMps: number; // m/s from optical flow
  altitudeM: number; // meters from depth estimation
  opticalFlow: OpticalFlowVector;
  featureCount: number;
  timestamp: number;
}

export interface DroneCoordinates {
  x: number; // meters east from start
  y: number; // meters north from start
  z: number; // meters altitude from ground
  heading: number; // degrees 0-360
  vx: number; // velocity east m/s
  vy: number; // velocity north m/s
  vz: number; // velocity up m/s
  timestamp?: number; // milliseconds since flight start
}
