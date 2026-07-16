import { OpticalFlowVector, CameraFeature } from '../types';
import { log } from './debugLog';

/**
 * Detect if camera is facing ground (low altitude, dense features)
 * Ground scenarios have unique optical flow characteristics
 */
export function detectGroundFacing(
  features: CameraFeature[],
  imageHeight: number
): boolean {
  if (features.length < 5) return false;

  // Check if features are concentrated at bottom (camera pointing down)
  const bottomFeatures = features.filter(f => f.y > imageHeight * 0.6).length;
  const isBottomHeavy = bottomFeatures > features.length * 0.5;

  // Check feature density (ground has dense, uniform features)
  if (features.length > 50) return isBottomHeavy;

  return false;
}

/**
 * Simple feature detection using brightness gradients
 * Detects corners and edges as potential features to track
 * Adaptive thresholds for ground-facing scenarios
 */
export function detectFeatures(
  imageData: ImageData,
  maxFeatures = 100,
  threshold = 0.08,
  isGroundFacing = false
): CameraFeature[] {
  const { data, width, height } = imageData;
  const features: CameraFeature[] = [];
  const featureMap = new Uint8Array(width * height);

  // Adaptive threshold: ground scenarios need even lower threshold for better tracking
  const adaptiveThreshold = isGroundFacing ? threshold * 0.6 : threshold;

  // Compute Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {

      // Sobel X
      const sobelX =
        -getGray(data, (y - 1) * width + (x - 1)) -
        2 * getGray(data, y * width + (x - 1)) -
        getGray(data, (y + 1) * width + (x - 1)) +
        getGray(data, (y - 1) * width + (x + 1)) +
        2 * getGray(data, y * width + (x + 1)) +
        getGray(data, (y + 1) * width + (x + 1));

      // Sobel Y
      const sobelY =
        -getGray(data, (y - 1) * width + (x - 1)) -
        2 * getGray(data, (y - 1) * width + x) -
        getGray(data, (y - 1) * width + (x + 1)) +
        getGray(data, (y + 1) * width + (x - 1)) +
        2 * getGray(data, (y + 1) * width + x) +
        getGray(data, (y + 1) * width + (x + 1));

      const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY) / 1024;
      const normalized = Math.min(1, magnitude);

      if (normalized > adaptiveThreshold) {
        featureMap[y * width + x] = Math.floor(normalized * 255);
      }
    }
  }

  // Non-maximum suppression
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = featureMap[y * width + x];
      if (center === 0) continue;

      const isMax =
        center >= featureMap[(y - 1) * width + (x - 1)] &&
        center >= featureMap[(y - 1) * width + x] &&
        center >= featureMap[(y - 1) * width + (x + 1)] &&
        center >= featureMap[y * width + (x - 1)] &&
        center >= featureMap[y * width + (x + 1)] &&
        center >= featureMap[(y + 1) * width + (x - 1)] &&
        center >= featureMap[(y + 1) * width + x] &&
        center >= featureMap[(y + 1) * width + (x + 1)];

      if (isMax) {
        features.push({
          id: features.length,
          x,
          y,
          score: center / 255,
          descriptor: computeDescriptor(imageData, x, y),
        });

        if (features.length >= maxFeatures) {
          return features.sort((a, b) => b.score - a.score).slice(0, maxFeatures);
        }
      }
    }
  }

  return features.sort((a, b) => b.score - a.score);
}

/**
 * Compute simple patch descriptor around a feature
 */
function computeDescriptor(imageData: ImageData, x: number, y: number, patchSize = 8): Uint8Array {
  const { data, width } = imageData;
  const descriptor = new Uint8Array(patchSize * patchSize);
  const half = Math.floor(patchSize / 2);

  for (let dy = -half; dy < half; dy++) {
    for (let dx = -half; dx < half; dx++) {
      const py = Math.max(0, Math.min(imageData.height - 1, y + dy));
      const px = Math.max(0, Math.min(width - 1, x + dx));
      const idx2 = (dy + half) * patchSize + (dx + half);
      descriptor[idx2] = getGray(data, py * width + px);
    }
  }

  return descriptor;
}

/**
 * Match features between two frames using descriptor similarity
 */
export function matchFeatures(
  prevFeatures: CameraFeature[],
  currFeatures: CameraFeature[],
  maxDistance = 50
): Array<{ prev: CameraFeature; curr: CameraFeature; distance: number }> {
  const matches: Array<{ prev: CameraFeature; curr: CameraFeature; distance: number }> = [];

  for (const prev of prevFeatures) {
    let bestMatch: CameraFeature | null = null;
    let bestDistance = Infinity;

    for (const curr of currFeatures) {
      const pixelDistance = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      if (pixelDistance > maxDistance) continue;

      const descDistance = descriptorDistance(prev.descriptor, curr.descriptor);
      if (descDistance < bestDistance) {
        bestDistance = descDistance;
        bestMatch = curr;
      }
    }

    if (bestMatch && bestDistance < 100) {
      matches.push({
        prev,
        curr: bestMatch,
        distance: bestDistance,
      });
    }
  }

  return matches;
}

/**
 * Calculate Hamming distance between two descriptors
 */
function descriptorDistance(desc1: Uint8Array, desc2: Uint8Array): number {
  let distance = 0;
  const len = Math.min(desc1.length, desc2.length);
  for (let i = 0; i < len; i++) {
    const diff = desc1[i] - desc2[i];
    distance += diff * diff;
  }
  return Math.sqrt(distance);
}

/**
 * Calculate optical flow from feature matches
 */
export function calculateOpticalFlow(
  matches: Array<{ prev: CameraFeature; curr: CameraFeature; distance: number }>
): OpticalFlowVector {
  if (matches.length === 0) {
    return {
      x: 0,
      y: 0,
      magnitude: 0,
      angle: 0,
    };
  }

  // Calculate median flow vector
  const flowX = matches.map(m => m.curr.x - m.prev.x);
  const flowY = matches.map(m => m.curr.y - m.prev.y);

  flowX.sort((a, b) => a - b);
  flowY.sort((a, b) => a - b);

  const medianX = flowX[Math.floor(flowX.length / 2)];
  const medianY = flowY[Math.floor(flowY.length / 2)];

  const magnitude = Math.hypot(medianX, medianY);
  const angle = Math.atan2(medianY, medianX);

  log.debug(
    `Optical flow: x=${medianX.toFixed(2)}, y=${medianY.toFixed(2)}, mag=${magnitude.toFixed(2)}`
  );

  return {
    x: medianX,
    y: medianY,
    magnitude,
    angle,
  };
}

/**
 * Convert optical flow (pixels) to real-world speed (m/s)
 * speed = (pixelFlow * pixelSize * focalLength) / (dt * focalLength)
 * Simplified: speed = (pixelFlow * pixelSize) / dt
 * But actually: speed = distance * pixelFlow / dt / focalLength
 * For known altitude: speed = (pixelFlow * altitude) / (focalLength * dt)
 */
export function opticalFlowToSpeed(
  flowMagnitude: number, // pixels per frame
  dtSeconds: number,
  altitude: number, // meters
  focalLength: number // pixels
): number {
  if (dtSeconds <= 0 || focalLength <= 0) return 0;

  // Using perspective: objects at altitude appear to move in image at rate:
  // pixelVelocity = (realVelocity * focalLength) / altitude
  // Solving: realVelocity = (pixelVelocity * altitude) / focalLength

  const pixelVelocity = flowMagnitude / dtSeconds; // pixels/second
  const realVelocity = (pixelVelocity * altitude) / focalLength;

  return Math.max(0, realVelocity);
}

/**
 * Estimate altitude change from vertical feature positions
 * Can be positive (climbing stairs/mountains) or negative (lowering phone/downhill)
 * Altitude is relative to starting point, not absolute ground level
 *
 * Method: Analyze vertical position of features in camera frame
 * - Features at top of frame = farther away or higher up
 * - Features at bottom of frame = closer or lower down
 */
export function estimateAltitudeFromFeatures(
  features: CameraFeature[],
  imageHeight: number,
  _focalLength: number,
  _droneHeightM = 0
): number {
  if (features.length === 0) return 0;

  // Calculate average vertical position of features in image
  const avgY = features.reduce((sum, f) => sum + f.y, 0) / features.length;
  const normalizedY = (imageHeight - avgY) / imageHeight; // 0 = top, 1 = bottom

  // Map feature position to altitude change
  // Center (norm=0.5) = no change (0m)
  // Top (norm=0) = climbing up (+1.5m, stairs/mountain)
  // Bottom (norm=1) = going down (-1.5m, lowering phone/downhill)

  const maxAltitudeChange = 1.5; // Max ±1.5 meters altitude change
  const altitudeChange = (normalizedY - 0.5) * 2 * maxAltitudeChange;

  return altitudeChange;
}

function getGray(data: Uint8ClampedArray, pixelIdx: number): number {
  const idx = pixelIdx * 4;
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  return (r + g + b) / 3;
}
