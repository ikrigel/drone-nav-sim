import { DroneCoordinates } from '../types';

export interface FlightCourse {
  id: string;
  name: string;
  createdAt: number;
  duration: number;
  distance: number;
  maxAltitude: number;
  points: DroneCoordinates[];
}

export function exportFlightCourse(
  name: string,
  points: DroneCoordinates[],
  duration: number,
  distance: number,
  maxAltitude: number
): string {
  const course: FlightCourse = {
    id: `flight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    createdAt: Date.now(),
    duration,
    distance,
    maxAltitude,
    points,
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
