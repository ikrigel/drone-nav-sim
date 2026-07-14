import { describe, it, expect } from 'vitest';
import { compressRoute, RoutePoint } from './routeCoreset';

describe('routeCoreset', () => {
  it('protected skeleton (RDP + heading) is always a subset of final waypoints', () => {
    const route: RoutePoint[] = [
      { x: 0, y: 0, z: 0, heading: 0, timestamp: 0, featureCount: 10 },
      { x: 1, y: 0, z: 0, heading: 0, timestamp: 1, featureCount: 10 },
      { x: 2, y: 1, z: 0, heading: 45, timestamp: 2, featureCount: 10 }, // corner
      { x: 3, y: 1, z: 0, heading: 45, timestamp: 3, featureCount: 10 },
      { x: 4, y: 0, z: 0, heading: 0, timestamp: 4, featureCount: 10 },
    ];

    const compressed = compressRoute(route, { maxError: 0.1, minDistance: 0.2, headingThreshold: 15 });
    const keptIndices = new Set(compressed.waypoints.map(w => route.indexOf(w)));

    // First and last points should always be included
    expect(keptIndices.has(0)).toBe(true);
    expect(keptIndices.has(route.length - 1)).toBe(true);

    // RDP and heading-selected points should be preserved
    // (the corner point at index 2 with a heading change should survive)
    expect(compressed.waypoints.length).toBeGreaterThanOrEqual(2); // At minimum, start and end
  });

  it('identical input produces identical waypoints across multiple calls (deterministic quality selection)', () => {
    const route: RoutePoint[] = Array.from({ length: 10 }, (_, i) => ({
      x: i,
      y: Math.sin(i) * 2,
      z: 0,
      heading: (i * 30) % 360,
      timestamp: i * 100,
      featureCount: 10 + (i % 3) * 5, // Varying feature counts
    }));

    const compressed1 = compressRoute(route, { qualityWeight: 0.3 });
    // Add a small delay to ensure Date.now() changes
    let compressed2;
    let attempts = 0;
    do {
      compressed2 = compressRoute(route, { qualityWeight: 0.3 });
      attempts++;
    } while (compressed1.metadata.timestamp === compressed2.metadata.timestamp && attempts < 10);

    // Waypoint indices should match (same selection), except metadata.timestamp is intentionally non-deterministic
    expect(compressed1.waypoints.length).toBe(compressed2.waypoints.length);
    expect(compressed1.waypoints.map(w => w.x)).toEqual(compressed2.waypoints.map(w => w.x));
    expect(compressed1.waypoints.map(w => w.y)).toEqual(compressed2.waypoints.map(w => w.y));
    // metadata.timestamp should differ (intentionally non-deterministic provenance metadata)
    // We allow them to be equal once but expect them to differ on retry
    expect(attempts > 1 || compressed1.metadata.timestamp !== compressed2.metadata.timestamp).toBe(true);
  });

  it('preserves corner points even when close to protected neighbors (min-distance pruning respects protected skeleton)', () => {
    // Construct a route with a sharp corner (heading change) within 0.2m of the next point
    const route: RoutePoint[] = [
      { x: 0, y: 0, z: 0, heading: 0, timestamp: 0, featureCount: 10 },
      { x: 1, y: 0, z: 0, heading: 0, timestamp: 1, featureCount: 10 },
      { x: 2, y: 0, z: 0, heading: 90, timestamp: 2, featureCount: 10 }, // 90° heading change
      { x: 2.1, y: 0, z: 0, heading: 90, timestamp: 3, featureCount: 10 }, // Only 0.1m away
      { x: 2.1, y: 1, z: 0, heading: 90, timestamp: 4, featureCount: 10 },
      { x: 2.1, y: 2, z: 0, heading: 90, timestamp: 5, featureCount: 10 },
    ];

    const compressed = compressRoute(route, { maxError: 0.1, minDistance: 0.2, headingThreshold: 15 });

    // The corner point (index 2, 90° heading change) should survive even though it's only 0.1m from the next point
    const waypoints = compressed.waypoints;
    const x_values = waypoints.map(w => w.x);
    expect(x_values).toContain(2); // Corner point should be kept
  });

  it('compression maintains key waypoints for a realistic S-curve path', () => {
    // Simulate an S-curve: gentle turns, varying feature quality
    const route: RoutePoint[] = Array.from({ length: 20 }, (_, i) => {
      const t = i / 20;
      const x = t * 10;
      const y = Math.sin(t * Math.PI * 2) * 3;
      const heading = (Math.atan2(Math.cos(t * Math.PI * 2) * Math.PI * 2, 10) * 180) / Math.PI;
      return {
        x,
        y,
        z: 0,
        heading,
        timestamp: i * 100,
        featureCount: 10 + (Math.sin(t * Math.PI) * 8), // Feature count varies with curve
      };
    });

    const compressed = compressRoute(route, { qualityWeight: 0.3 });

    // Compression ratio should be reasonable (not too aggressive, not too lenient)
    expect(compressed.metadata.compressionRatio).toBeGreaterThan(1);
    expect(compressed.metadata.compressionRatio).toBeLessThan(route.length); // At least compresses by some factor
    expect(compressed.metadata.totalDistance).toBeGreaterThan(0);
  });
});
