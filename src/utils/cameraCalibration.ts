import { CameraCalibration } from '../types';
import { safeStorageGet, safeStorageSet } from './storage';

const CALIBRATION_KEY = 'drone-nav:camera-calibration:v1';

/**
 * Estimate camera intrinsics from device properties
 * Uses device screen properties to approximate focal length
 */
export function estimateCameraIntrinsics(video: HTMLVideoElement): CameraCalibration {
  const width = video.videoWidth;
  const height = video.videoHeight;

  // Estimate focal length based on typical phone camera FOV (~50-70 degrees)
  // Using approximate formula: f = (width/2) / tan(FOV/2)
  // Assuming horizontal FOV ~60 degrees
  const horFOV = (60 * Math.PI) / 180;
  const focalLengthX = (width / 2) / Math.tan(horFOV / 2);
  const focalLengthY = focalLengthX * (height / width); // Adjusted for aspect ratio

  return {
    focalLengthX,
    focalLengthY,
    principalPointX: width / 2,
    principalPointY: height / 2,
    pixelSize: 0.0011, // ~1.1 micrometers (typical phone sensor)
    timestamp: Date.now(),
  };
}

/**
 * Load calibration from localStorage or create new one
 */
export function loadOrCreateCalibration(video?: HTMLVideoElement): CameraCalibration {
  const stored = safeStorageGet<CameraCalibration | null>(CALIBRATION_KEY, null);

  if (stored && typeof stored === 'object' && 'focalLengthX' in stored) {
    return stored;
  }

  // Create new calibration
  const calibration = video
    ? estimateCameraIntrinsics(video)
    : {
        focalLengthX: 600, // Default estimate
        focalLengthY: 600,
        principalPointX: 320,
        principalPointY: 240,
        pixelSize: 0.0011,
        timestamp: Date.now(),
      };

  saveCalibration(calibration);
  return calibration;
}

/**
 * Save calibration to localStorage
 */
export function saveCalibration(calibration: CameraCalibration): void {
  safeStorageSet(CALIBRATION_KEY, calibration);
}

/**
 * Calculate real-world distance from pixel disparity using calibration
 * distance = (baseline * focalLength) / disparity
 * For monocular camera, we use known object sizes or brightness fallback
 */
export function pixelDisparityToDistance(
  disparity: number, // pixels
  calibration: CameraCalibration,
  knownObjectHeight?: number // meters
): number {
  if (!knownObjectHeight) {
    // Fallback: use brightness-based estimation
    return Math.max(0.5, 50 - disparity * 0.1);
  }

  // Using pin-hole camera model
  // actualHeight = (pixelHeight * distance) / focalLength
  // Solving for distance: distance = (actualHeight * focalLength) / pixelHeight
  const distance = (knownObjectHeight * calibration.focalLengthY) / (disparity + 0.001);
  return Math.max(0.1, distance);
}

/**
 * Get stored calibrations history
 */
export function getCalibrationHistory(): CameraCalibration[] {
  const stored = safeStorageGet<CameraCalibration[]>('drone-nav:calibration-history:v1', []);
  return Array.isArray(stored) ? stored : [];
}

/**
 * Add calibration to history
 */
export function addCalibrationToHistory(calibration: CameraCalibration, maxHistory = 10): void {
  const history = getCalibrationHistory();
  history.push(calibration);
  if (history.length > maxHistory) {
    history.shift();
  }
  safeStorageSet('drone-nav:calibration-history:v1', history);
}
