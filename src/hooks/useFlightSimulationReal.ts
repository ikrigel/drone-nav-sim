import { useState, useRef, useCallback, useEffect } from 'react';
import { TrackPoint, FlightState, DeviceOrientationState, DeviceMotionState, CameraDistanceState } from '../types';
import { safeStorageGet, safeStorageSet } from '../utils/storage';
import { log } from '../utils/debugLog';

interface UseFlightSimulationRealProps {
  orientationState: DeviceOrientationState;
  motionState: DeviceMotionState;
  cameraState: CameraDistanceState;
}

export function useFlightSimulationReal(props: UseFlightSimulationRealProps) {
  const { orientationState, motionState, cameraState } = props;

  const [isFlying, setIsFlying] = useState(false);
  const [position, setPosition] = useState<FlightState>({ x: 0, y: 0, z: 0 });
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [maxAltitude, setMaxAltitude] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  const stateRef = useRef({
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 }, // m/s
    trackPoints: [] as TrackPoint[],
    totalDistance: 0,
    maxAltitude: 0,
    startTime: 0,
    lastFrameTime: 0,
    lastTrackPointTime: 0,
  });

  const startFlight = useCallback(() => {
    log.info('Flight started');
    const now = Date.now();
    stateRef.current = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      trackPoints: [],
      totalDistance: 0,
      maxAltitude: 0,
      startTime: now,
      lastFrameTime: now,
      lastTrackPointTime: now,
    };

    setPosition({ x: 0, y: 0, z: 0 });
    setTrackPoints([]);
    setTotalDistance(0);
    setMaxAltitude(0);
    setElapsedMs(0);
    setCurrentSpeed(0);
    setIsFlying(true);
  }, []);

  const stopFlight = useCallback(() => {
    log.info('Flight stopped');
    setIsFlying(false);

    // Save session
    if (stateRef.current.trackPoints.length > 0) {
      const session: any = {
        id: `session-${Date.now()}`,
        startedAt: stateRef.current.startTime,
        endedAt: Date.now(),
        points: stateRef.current.trackPoints,
        totalDistanceM: stateRef.current.totalDistance,
        maxAltitudeM: stateRef.current.maxAltitude,
        durationMs: Date.now() - stateRef.current.startTime,
      };

      const sessions: any[] = safeStorageGet('drone-nav:flight-sessions:v1', []);
      sessions.push(session);
      safeStorageSet('drone-nav:flight-sessions:v1', sessions.slice(-50)); // Keep last 50
    }
  }, []);

  const resetFlight = useCallback(() => {
    log.info('Flight reset');
    setIsFlying(false);
    setPosition({ x: 0, y: 0, z: 0 });
    setTrackPoints([]);
    setTotalDistance(0);
    setMaxAltitude(0);
    setElapsedMs(0);
    setCurrentSpeed(0);

    stateRef.current = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      trackPoints: [],
      totalDistance: 0,
      maxAltitude: 0,
      startTime: 0,
      lastFrameTime: 0,
      lastTrackPointTime: 0,
    };
  }, []);

  const recalibrate = useCallback(() => {
    log.info('Recalibrated');
    // In real sensor mode, recalibration would reset velocity to zero
    stateRef.current.velocity = { x: 0, y: 0, z: 0 };
  }, []);

  // Main simulation loop
  useEffect(() => {
    if (!isFlying) return;

    const animationFrameId = requestAnimationFrame(function updateFlight() {
      const now = Date.now();
      const dt = Math.max(0.001, (now - stateRef.current.lastFrameTime) / 1000); // seconds
      stateRef.current.lastFrameTime = now;

      // Acceleration from device motion (m/s²)
      const accelX = motionState.accelX ?? 0;
      const accelY = motionState.accelY ?? 0;
      const accelZ = motionState.accelZ ?? 0;

      // Apply gravity compensation (remove ~9.8 m/s² from Z)
      const accelZAdjusted = accelZ - 9.8;

      // Update velocity via integration
      const state = stateRef.current;
      state.velocity.x += accelX * dt;
      state.velocity.y += accelY * dt;
      state.velocity.z += accelZAdjusted * dt;

      // Low-pass filter velocity (damping)
      const damping = 0.95;
      state.velocity.x *= damping;
      state.velocity.y *= damping;
      state.velocity.z *= damping;

      // Calculate speed (magnitude of horizontal velocity)
      const speedMs = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);

      // Update position
      state.position.x += state.velocity.y * dt; // north
      state.position.y += state.velocity.x * dt; // east
      state.position.z = cameraState.distance ?? 0; // altitude from camera

      // Clamp altitude to non-negative
      state.position.z = Math.max(0, state.position.z);

      // Update tracking
      state.maxAltitude = Math.max(state.maxAltitude, state.position.z);

      // Add track point (throttled to ~4/sec)
      if (now - state.lastTrackPointTime >= 250) {
        const point: TrackPoint = {
          t: now - state.startTime,
          x: state.position.x,
          y: state.position.y,
          z: state.position.z,
          heading: orientationState.heading ?? 0,
          speed: speedMs,
        };

        state.trackPoints.push(point);

        // Calculate distance traveled
        if (state.trackPoints.length > 1) {
          const prev = state.trackPoints[state.trackPoints.length - 2];
          const dx = point.x - prev.x;
          const dy = point.y - prev.y;
          const dz = point.z - prev.z;
          const segment = Math.sqrt(dx * dx + dy * dy + dz * dz);
          state.totalDistance += segment;
        }

        state.lastTrackPointTime = now;

        log.debug(
          `Pos: (${state.position.x.toFixed(1)}, ${state.position.y.toFixed(1)}, ${state.position.z.toFixed(1)})` +
          ` Vel: (${state.velocity.x.toFixed(2)}, ${state.velocity.y.toFixed(2)}, ${state.velocity.z.toFixed(2)})` +
          ` Speed: ${speedMs.toFixed(2)} m/s`
        );
      }

      // Update React state
      setPosition({ ...state.position });
      setTrackPoints([...state.trackPoints]);
      setTotalDistance(state.totalDistance);
      setMaxAltitude(state.maxAltitude);
      setElapsedMs(now - state.startTime);
      setCurrentSpeed(speedMs);

      if (isFlying) {
        requestAnimationFrame(updateFlight);
      }
    });

    return () => cancelAnimationFrame(animationFrameId);
  }, [isFlying, orientationState.heading, motionState, cameraState]);

  return {
    isFlying,
    position,
    trackPoints,
    totalDistance,
    maxAltitude,
    elapsedMs,
    currentSpeed,
    startFlight,
    stopFlight,
    resetFlight,
    recalibrate,
  };
}
