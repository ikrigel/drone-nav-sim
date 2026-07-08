/**
 * Coreset-based route compression
 * Keeps only essential waypoints while preserving route shape and quality
 * Reduces data size by 10-50x without significant quality loss
 */

export interface RoutePoint {
  x: number;
  y: number;
  z: number;
  heading: number;
  timestamp: number;
  featureCount?: number; // Camera feature quality metric
  speed?: number;
}

export interface CompressedRoute {
  version: 1;
  waypoints: RoutePoint[]; // Key waypoints only
  metadata: {
    originalPointCount: number;
    compressedPointCount: number;
    compressionRatio: number;
    totalDistance: number;
    timestamp: number;
  };
}

/**
 * Calculate distance between two 2D points
 */
function distance2D(p1: RoutePoint, p2: RoutePoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate perpendicular distance from point to line segment
 * Used for Ramer-Douglas-Peucker algorithm
 */
function perpendicularDistance(
  point: RoutePoint,
  lineStart: RoutePoint,
  lineEnd: RoutePoint
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  const denominator = Math.sqrt(dx * dx + dy * dy);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Ramer-Douglas-Peucker algorithm for trajectory simplification
 * Keeps points that deviate significantly from straight line
 */
function rdpSimplify(points: RoutePoint[], epsilon: number): number[] {
  if (points.length < 3) return [0, points.length - 1];

  // Find point with maximum distance from line
  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (dist > maxDistance) {
      maxDistance = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon);
    const right = rdpSimplify(points.slice(maxIndex), epsilon);

    // Combine results (avoid duplicating middle point)
    return [...left.slice(0, -1), ...right.map(idx => (idx === 0 ? maxIndex : idx + maxIndex))];
  }

  // Keep only start and end points
  return [0, points.length - 1];
}

/**
 * Calculate heading change (direction change) between consecutive points
 */
function headingChange(h1: number, h2: number): number {
  let diff = h2 - h1;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return Math.abs(diff);
}

/**
 * Compress route using coreset approach
 * Combines geometric importance with camera tracking quality
 */
export function compressRoute(
  fullRoute: RoutePoint[],
  options: {
    maxError?: number; // Max perpendicular distance (meters)
    minDistance?: number; // Min distance between waypoints
    headingThreshold?: number; // Min heading change to keep point (degrees)
    qualityWeight?: number; // Weight for camera feature count
  } = {}
): CompressedRoute {
  const {
    maxError = 0.1, // 10cm error tolerance
    minDistance = 0.2, // 20cm minimum spacing
    headingThreshold = 15, // 15 degree turns
    qualityWeight = 0.3, // Camera quality importance
  } = options;

  if (fullRoute.length < 3) {
    return {
      version: 1,
      waypoints: fullRoute,
      metadata: {
        originalPointCount: fullRoute.length,
        compressedPointCount: fullRoute.length,
        compressionRatio: 1,
        totalDistance: 0,
        timestamp: Date.now(),
      },
    };
  }

  // Step 1: Use RDP algorithm for geometric simplification
  const rdpIndices = rdpSimplify(fullRoute, maxError);

  // Step 2: Quality-based filtering
  // Keep points with high feature counts (good tracking quality)
  const avgFeatures =
    fullRoute.reduce((sum, p) => sum + (p.featureCount || 10), 0) / fullRoute.length;

  const qualityFiltered: number[] = [];

  for (let i = 0; i < fullRoute.length; i++) {
    const point = fullRoute[i];
    const quality = (point.featureCount || 10) / avgFeatures;

    // Keep high-quality points more aggressively
    if (quality > 1.2) {
      qualityFiltered.push(i);
    }
  }

  // Step 3: Heading-based filtering
  // Keep points where direction changes significantly
  const headingFiltered: Set<number> = new Set([0, fullRoute.length - 1]);

  for (let i = 1; i < fullRoute.length - 1; i++) {
    const heading1 = fullRoute[i - 1].heading;
    const heading2 = fullRoute[i].heading;
    const heading3 = fullRoute[i + 1].heading;

    const change1 = headingChange(heading1, heading2);
    const change2 = headingChange(heading2, heading3);

    if (change1 > headingThreshold || change2 > headingThreshold) {
      headingFiltered.add(i);
    }
  }

  // Step 4: Combine all selected indices
  const selectedIndices = new Set<number>();
  selectedIndices.add(0);
  selectedIndices.add(fullRoute.length - 1);

  // Add RDP points
  rdpIndices.forEach(i => selectedIndices.add(i));

  // Add quality points (with weight)
  qualityFiltered.forEach(i => {
    if (Math.random() < qualityWeight) {
      selectedIndices.add(i);
    }
  });

  // Add heading change points
  headingFiltered.forEach(i => selectedIndices.add(i));

  // Step 5: Enforce minimum distance between waypoints
  const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
  const finalIndices: number[] = [sortedIndices[0]];

  for (let i = 1; i < sortedIndices.length; i++) {
    const lastKept = finalIndices[finalIndices.length - 1];
    const currentIdx = sortedIndices[i];

    if (distance2D(fullRoute[lastKept], fullRoute[currentIdx]) >= minDistance) {
      finalIndices.push(currentIdx);
    }
  }

  // Ensure end point is included
  if (finalIndices[finalIndices.length - 1] !== fullRoute.length - 1) {
    finalIndices.push(fullRoute.length - 1);
  }

  const waypoints = finalIndices.map(i => fullRoute[i]);

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < fullRoute.length; i++) {
    totalDistance += distance2D(fullRoute[i - 1], fullRoute[i]);
  }

  return {
    version: 1,
    waypoints,
    metadata: {
      originalPointCount: fullRoute.length,
      compressedPointCount: waypoints.length,
      compressionRatio: fullRoute.length / waypoints.length,
      totalDistance,
      timestamp: Date.now(),
    },
  };
}

/**
 * Estimate full route from compressed waypoints (for visualization)
 * Uses linear interpolation between waypoints
 */
export function expandRoute(compressed: CompressedRoute, interpolationPoints: number = 5): RoutePoint[] {
  if (compressed.waypoints.length < 2) {
    return compressed.waypoints;
  }

  const expanded: RoutePoint[] = [];

  for (let i = 0; i < compressed.waypoints.length - 1; i++) {
    const start = compressed.waypoints[i];
    const end = compressed.waypoints[i + 1];

    // Add start point
    expanded.push(start);

    // Interpolate between points
    for (let j = 1; j < interpolationPoints; j++) {
      const t = j / interpolationPoints;
      expanded.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t,
        heading: start.heading + (end.heading - start.heading) * t,
        timestamp: start.timestamp + (end.timestamp - start.timestamp) * t,
        featureCount: start.featureCount,
        speed: start.speed,
      });
    }
  }

  // Add final point
  expanded.push(compressed.waypoints[compressed.waypoints.length - 1]);

  return expanded;
}

/**
 * Estimate file size reduction
 */
export function estimateFileSizeReduction(original: RoutePoint[], compressed: RoutePoint[]): {
  originalSize: number;
  compressedSize: number;
  reduction: string;
} {
  // Rough estimate: each point ~120 bytes as JSON
  const pointSize = 120;
  const originalSize = original.length * pointSize;
  const compressedSize = compressed.length * pointSize;

  return {
    originalSize,
    compressedSize,
    reduction: `${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
  };
}
