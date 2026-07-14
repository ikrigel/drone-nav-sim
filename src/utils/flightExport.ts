import { DroneCoordinates } from '../types';
import { compressRoute, CompressedRoute } from './routeCoreset';
import { round6 } from './precision';

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

  // Round numeric fields to 6dp for consistent precision
  const roundedPoints = points.map(p => ({
    ...p,
    x: round6(p.x),
    y: round6(p.y),
    z: round6(p.z),
    heading: round6(p.heading),
    vx: round6(p.vx),
    vy: round6(p.vy),
    vz: round6(p.vz),
  }));

  const roundedCompressed = compressed && {
    ...compressed,
    waypoints: compressed.waypoints.map(w => ({
      ...w,
      x: round6(w.x),
      y: round6(w.y),
      z: round6(w.z),
      heading: round6(w.heading),
    })),
    metadata: {
      ...compressed.metadata,
      totalDistance: round6(compressed.metadata.totalDistance),
    },
  };

  const course: FlightCourse = {
    id: `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    duration,
    distance: round6(distance),
    maxAltitude: round6(maxAltitude),
    points: roundedPoints,
    compressed: roundedCompressed,
    coordinateSet,
  };

  return JSON.stringify(course, null, 2);
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
