import { DroneCoordinates } from '../types';
import { compressRoute, CompressedRoute } from './routeCoreset';
import { roundDisplay } from './precision';

/**
 * Convert meters to degrees for Google Maps style display
 * Assumes x = north, y = east (from starting point)
 * At equator: 1 meter ≈ 0.000009 degrees latitude/longitude
 */
function metersToGoogleMapsStyle(x: number, y: number): { north: number; east: number } {
  const metersPerDegree = 111111; // At equator
  return {
    north: Number((x / metersPerDegree).toFixed(6)),
    east: Number((y / metersPerDegree).toFixed(6)),
  };
}

/**
 * Custom JSON replacer that limits all numbers to 6 decimal places
 */
function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'number' && !Number.isInteger(value)) {
    // Limit to 6 decimal places by rounding
    const factor = 1000000;
    return Math.round(value * factor) / factor;
  }
  return value;
}

export interface FlightCourse {
  id: string;
  name: string;
  createdAt: number;
  duration: number;
  distance: number;
  maxAltitude: number;
  points: DroneCoordinates[];
  compressed?: CompressedRoute; // Optional compressed version
  coordinateSet?: '3dof' | '4dof' | '6dof'; // Which coordinate set captured this course
}

export function exportFlightCourse(
  name: string,
  points: DroneCoordinates[],
  duration: number,
  distance: number,
  maxAltitude: number,
  includeCompressed: boolean = true,
  coordinateSet: '3dof' | '4dof' | '6dof' = '4dof'
): string {
  // Convert points to coreset format (add timestamp if missing)
  const coresetPoints = points.map((p, i) => ({
    ...p,
    timestamp: p.timestamp || i * 100, // Default: 100ms between points
  }));

  // Compress route using coreset algorithm
  const compressed = includeCompressed ? compressRoute(coresetPoints) : undefined;

  // Round numeric fields and add Google Maps style coordinates
  // Maps style uses 6 decimal places for lat/lon (standard Google format)
  const roundedPoints = points.map(p => {
    const maps = metersToGoogleMapsStyle(p.x, p.y);
    return {
      ...p,
      x: roundDisplay(p.x),
      y: roundDisplay(p.y),
      z: roundDisplay(p.z),
      heading: roundDisplay(p.heading),
      vx: roundDisplay(p.vx),
      vy: roundDisplay(p.vy),
      vz: roundDisplay(p.vz),
      // Google Maps style: north/east in degrees (6 decimal places)
      north: maps.north,
      east: maps.east,
    };
  });

  const roundedCompressed = compressed && {
    ...compressed,
    waypoints: compressed.waypoints.map(w => {
      const maps = metersToGoogleMapsStyle(w.x, w.y);
      return {
        ...w,
        x: roundDisplay(w.x),
        y: roundDisplay(w.y),
        z: roundDisplay(w.z),
        heading: roundDisplay(w.heading),
        // Google Maps style: north/east in degrees (6 decimal places)
        north: maps.north,
        east: maps.east,
      };
    }),
    metadata: {
      ...compressed.metadata,
      totalDistance: roundDisplay(compressed.metadata.totalDistance),
    },
  };

  const course: FlightCourse = {
    id: `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    duration,
    distance: roundDisplay(distance),
    maxAltitude: roundDisplay(maxAltitude),
    points: roundedPoints,
    compressed: roundedCompressed,
    coordinateSet,
  };

  // Use custom replacer to limit all numbers to 6 decimal places
  return JSON.stringify(course, jsonReplacer, 2);
}

export function importFlightCourse(jsonString: string): FlightCourse | null {
  try {
    const course = JSON.parse(jsonString);

    // Validate structure
    if (!course.id || !course.name || !Array.isArray(course.points)) {
      return null;
    }

    return course;
  } catch (err) {
    return null;
  }
}

export function downloadFlightCourse(jsonString: string, filename: string) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function saveFlightCourseToStorage(course: FlightCourse) {
  try {
    const key = 'drone-nav:flight-courses:v1';
    const stored = localStorage.getItem(key);
    const courses: FlightCourse[] = stored ? JSON.parse(stored) : [];
    courses.push(course);
    localStorage.setItem(key, JSON.stringify(courses));
  } catch (err) {
    console.error('Failed to save flight course:', err);
  }
}

export function loadFlightCoursesFromStorage(): FlightCourse[] {
  try {
    const key = 'drone-nav:flight-courses:v1';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    return [];
  }
}

export function deleteFlightCourseFromStorage(id: string) {
  try {
    const key = 'drone-nav:flight-courses:v1';
    const stored = localStorage.getItem(key);
    const courses: FlightCourse[] = stored ? JSON.parse(stored) : [];
    const filtered = courses.filter(c => c.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to delete flight course:', err);
  }
}
