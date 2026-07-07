import { useState, useRef, useCallback, useEffect } from 'react';
import type { FlightState, TrackPoint, FlightSettings, DeviceOrientationState } from '../types';
import {
  tiltToSpeed,
  tiltToClimbRate,
  integrateStep,
  calculateDistance,
  findMaxAltitude,
} from '../utils/deadReckoning';

const DEFAULT_SETTINGS: FlightSettings = {
  pitchSensitivity: 0.5, // m/s per degree
  rollSensitivity: 0.25, // m/s per degree
  maxSpeed: 20, // m/s
  maxClimb: 10, // m/s
  deadzoneDeg: 3, // degrees
};

export interface UseFlightSimulationProps {
  sensorState: DeviceOrientationState;
  settings?: Partial<FlightSettings>;
}

export interface UseFlightSimulationResult {
  isFlying: boolean;
  position: FlightState;
  trackPoints: TrackPoint[];
  totalDistance: number;
  maxAltitude: number;
  elapsedMs: number;
  currentSpeed: number;
  neutralPitch: number | null;
  neutralRoll: number | null;
  startFlight: () => void;
  stopFlight: () => void;
  resetFlight: () => void;
  recalibrate: () => void;
}

export function useFlightSimulation(props: UseFlightSimulationProps): UseFlightSimulationResult {
  const { sensorState, settings } = props;
  const fullSettings = { ...DEFAULT_SETTINGS, ...settings };

  // Flight state
  const [isFlying, setIsFlying] = useState(false);
  const [position, setPosition] = useState<FlightState>({ x: 0, y: 0, z: 0 });
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // Refs for calibration and RAF loop
  const neutralPitchRef = useRef<number | null>(null);
  const neutralRollRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const flightStartTimeRef = useRef<number>(0);

  // Start flight
  const startFlight = useCallback(() => {
    if (sensorState.pitch === null || sensorState.roll === null) {
      alert('Sensors not ready');
      return;
    }

    neutralPitchRef.current = sensorState.pitch;
    neutralRollRef.current = sensorState.roll;
    lastTimeRef.current = performance.now();
    flightStartTimeRef.current = performance.now();

    setIsFlying(true);
    setPosition({ x: 0, y: 0, z: 0 });
    setTrackPoints([]);
    setElapsedMs(0);
    setCurrentSpeed(0);
  }, [sensorState.pitch, sensorState.roll]);

  // Stop flight
  const stopFlight = useCallback(() => {
    setIsFlying(false);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Reset flight
  const resetFlight = useCallback(() => {
    stopFlight();
    setPosition({ x: 0, y: 0, z: 0 });
    setTrackPoints([]);
    setElapsedMs(0);
    setCurrentSpeed(0);
    neutralPitchRef.current = null;
    neutralRollRef.current = null;
  }, [stopFlight]);

  // Recalibrate neutral pose mid-flight
  const recalibrate = useCallback(() => {
    if (sensorState.pitch === null || sensorState.roll === null) return;
    neutralPitchRef.current = sensorState.pitch;
    neutralRollRef.current = sensorState.roll;
  }, [sensorState.pitch, sensorState.roll]);

  // Main RAF loop
  useEffect(() => {
    if (!isFlying || neutralPitchRef.current === null || neutralRollRef.current === null) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      const lastTime = lastTimeRef.current;
      lastTimeRef.current = now;

      const dtMs = Math.max(now - lastTime, 1); // clamp to 1ms min
      const dtSeconds = dtMs / 1000;

      // Update elapsed
      const newElapsedMs = now - flightStartTimeRef.current;
      setElapsedMs(newElapsedMs);

      // Derive movement from current sensor state
      if (
        sensorState.heading === null ||
        sensorState.pitch === null ||
        sensorState.roll === null
      ) {
        // Sensors unavailable, continue loop but don't integrate
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const speed = tiltToSpeed(
        sensorState.pitch,
        neutralPitchRef.current!,
        fullSettings.pitchSensitivity,
        fullSettings.deadzoneDeg,
        fullSettings.maxSpeed
      );

      const climbRate = tiltToClimbRate(
        sensorState.roll,
        neutralRollRef.current!,
        fullSettings.rollSensitivity,
        fullSettings.deadzoneDeg,
        fullSettings.maxClimb
      );

      setCurrentSpeed(speed);

      // Integrate position
      setPosition(prev => {
        const newPos = integrateStep(prev, sensorState.heading, speed, climbRate, dtSeconds);

        // Throttle track points: max 4 per second
        setTrackPoints(prev => {
          const lastPoint = prev.length > 0 ? prev[prev.length - 1] : null;
          if (lastPoint && newElapsedMs - lastPoint.t < 250) {
            // Skip this tick if < 250ms since last point
            return prev;
          }

          const newPoint: TrackPoint = {
            t: newElapsedMs,
            x: newPos.x,
            y: newPos.y,
            z: newPos.z,
            heading: sensorState.heading,
            speed,
          };

          return [...prev, newPoint];
        });

        return newPos;
      });

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isFlying, sensorState, fullSettings]);

  return {
    isFlying,
    position,
    trackPoints,
    totalDistance: calculateDistance(trackPoints),
    maxAltitude: findMaxAltitude(trackPoints),
    elapsedMs,
    currentSpeed,
    neutralPitch: neutralPitchRef.current,
    neutralRoll: neutralRollRef.current,
    startFlight,
    stopFlight,
    resetFlight,
    recalibrate,
  };
}
