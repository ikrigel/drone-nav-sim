import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeature, OpticalFlowVector, DroneCoordinates, CameraCalibration } from '../types';
import {
  detectFeatures,
  matchFeatures,
  calculateOpticalFlow,
  opticalFlowToSpeed,
  estimateAltitudeFromFeatures,
} from '../utils/opticalFlow';
import { loadOrCreateCalibration } from '../utils/cameraCalibration';
import { KalmanFilter2D } from '../utils/kalmanFilter';
import { log } from '../utils/debugLog';

interface UseCameraMovementProps {
  isNavigating: boolean;
}

export function useCameraMovement({ isNavigating }: UseCameraMovementProps) {
  const [coordinates, setCoordinates] = useState<DroneCoordinates>({
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    vx: 0,
    vy: 0,
    vz: 0,
  });

  const [opticalFlow, setOpticalFlow] = useState<OpticalFlowVector>({
    x: 0,
    y: 0,
    magnitude: 0,
    angle: 0,
  });

  const [features, setFeatures] = useState<CameraFeature[]>([]);
  const [calibration, setCalibration] = useState<CameraCalibration | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const prevFeaturesRef = useRef<CameraFeature[]>([]);
  const prevTimestampRef = useRef<number>(0);
  const kalmanFilterRef = useRef<KalmanFilter2D>(new KalmanFilter2D(0, 0));
  const startingAltitudeRef = useRef<number>(0); // Reference altitude at flight start
  const coordsRef = useRef<DroneCoordinates>({
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
    vx: 0,
    vy: 0,
    vz: 0,
  });

  const startCamera = useCallback(async () => {
    try {
      log.info('Requesting camera access...');

      if (!navigator.mediaDevices?.getUserMedia) {
        log.error('Camera API not available - getUserMedia not supported');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false,
      });

      log.info('Camera stream obtained');
      streamRef.current = stream;
      setStream(stream);

      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.style.display = 'none';
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('playsinline', 'true');
        document.body.appendChild(videoRef.current);
        log.debug('Video element created');
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.style.display = 'none';
        document.body.appendChild(canvasRef.current);
        log.debug('Canvas element created');
      }

      videoRef.current.srcObject = stream;
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        await playPromise;
        log.debug('Video playback started');
      }

      // Wait for video to be ready with timeout
      let ready = false;
      for (let i = 0; i < 50; i++) {
        if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
          ready = true;
          log.debug('Video ready');
          break;
        }
        await new Promise(r => setTimeout(r, 100));
      }

      if (!ready) {
        log.warn('Video not ready after 5 seconds, proceeding anyway');
      }

      // Initialize calibration
      const calib = loadOrCreateCalibration(videoRef.current);
      setCalibration(calib);
      log.info('Camera ready - calibration loaded');

    } catch (err: any) {
      log.error(`Camera access denied or error: ${err?.message || err}`);
      if (err?.name === 'NotAllowedError') {
        log.error('Camera permission denied by user');
      } else if (err?.name === 'NotFoundError') {
        log.error('No camera device found');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    log.info('Camera stopped');
  }, []);

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !calibration || !isNavigating) {
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const timestamp = performance.now();

      // Detect features in current frame
      const currFeatures = detectFeatures(imageData, 100, 0.05);
      setFeatures(currFeatures);

      // Debug: log feature detection
      if (currFeatures.length === 0) {
        log.warn(`[FEAT] No features detected!`);
      } else if (currFeatures.length < 10) {
        log.debug(`[FEAT] Low count: ${currFeatures.length}`);
      }

      // Calculate optical flow from feature matching
      if (prevFeaturesRef.current.length > 0) {
        const matches = matchFeatures(prevFeaturesRef.current, currFeatures, 100);
        const flow = calculateOpticalFlow(matches);
        setOpticalFlow(flow);

        // Debug: log matching and optical flow
        if (matches.length === 0) {
          log.warn(`[OF] NO MATCHES! Prev: ${prevFeaturesRef.current.length}, Curr: ${currFeatures.length}`);
        } else if (matches.length < 5) {
          log.debug(`[OF] Few matches: ${matches.length}`);
        } else {
          log.debug(`[OF] Matches: ${matches.length} | flowX: ${flow.x.toFixed(2)}px | flowY: ${flow.y.toFixed(2)}px | mag: ${flow.magnitude.toFixed(2)}px | angle: ${(flow.angle * 180 / Math.PI).toFixed(1)}°`);
        }

        if (prevTimestampRef.current > 0) {
          const dtSeconds = (timestamp - prevTimestampRef.current) / 1000;

          if (dtSeconds > 0 && dtSeconds < 1) {
            // Estimate altitude from feature positions
            const altitude = estimateAltitudeFromFeatures(
              currFeatures,
              canvas.height,
              calibration.focalLengthY
            );

            // Calculate speed from optical flow
            let speed = opticalFlowToSpeed(
              flow.magnitude,
              dtSeconds,
              altitude,
              calibration.focalLengthY
            );

            // Sanity check: cap speed to reasonable indoor walking speed (0-3 m/s)
            // Typical human walking: 1.4 m/s
            // Running: 3-5 m/s
            // For indoor phone use: cap at 3 m/s
            const maxReasonableSpeed = 3.0; // m/s
            if (speed > maxReasonableSpeed) {
              log.warn(`Speed unreasonable: ${speed.toFixed(2)} m/s (capped to ${maxReasonableSpeed} m/s), alt=${altitude.toFixed(1)}m, flow=${flow.magnitude.toFixed(1)}px`);
              speed = maxReasonableSpeed;
            }

            // Update velocity based on flow angle and device heading
            const flowHeading = (flow.angle * 180 / Math.PI + 360) % 360;
            const vx = Math.sin((flowHeading * Math.PI) / 180) * speed;
            const vy = Math.cos((flowHeading * Math.PI) / 180) * speed;

            // Debug: log heading calculation
            if (speed > 0.01) {
              log.debug(`[FLOW] angle=${flow.angle.toFixed(3)}rad flowHeading=${flowHeading.toFixed(1)}° flowMag=${flow.magnitude.toFixed(2)}px vx=${vx.toFixed(3)} vy=${vy.toFixed(3)} speed=${speed.toFixed(2)}m/s`);
            }

            // Sanity check: limit position change per frame
            const maxPositionDelta = 0.5; // max 0.5m per frame
            const positionDelta = Math.sqrt((vx * dtSeconds) ** 2 + (vy * dtSeconds) ** 2);

            let finalVx = vx;
            let finalVy = vy;
            if (positionDelta > maxPositionDelta && positionDelta > 0) {
              const scale = maxPositionDelta / positionDelta;
              finalVx = vx * scale;
              finalVy = vy * scale;
              log.warn(`Position delta too large: ${positionDelta.toFixed(2)}m, scaled by ${scale.toFixed(2)}`);
            }

            // Update raw position
            const rawX = coordsRef.current.x + finalVx * dtSeconds;
            const rawY = coordsRef.current.y + finalVy * dtSeconds;

            // Apply Kalman filter to smooth position estimates
            // This reduces noise and drift from optical flow
            const smoothed = kalmanFilterRef.current.update(rawX, rawY);

            // Calculate relative altitude (can be positive or negative)
            // Altitude starts at 0 when flight begins
            // Can climb stairs/mountains (+1.5m) or lower phone/downhill (-1.5m)
            const relativeAltitude = altitude - startingAltitudeRef.current;

            // Calculate vertical velocity from altitude change
            const prevZ = coordsRef.current.z;
            const vz = (relativeAltitude - prevZ) / dtSeconds;

            // Update position with smoothed estimates
            coordsRef.current = {
              ...coordsRef.current,
              x: smoothed.x,
              y: smoothed.y,
              z: relativeAltitude, // Can be positive (up) or negative (down)
              heading: flowHeading,
              vx: finalVx,
              vy: finalVy,
              vz, // Vertical velocity
              featureCount: currFeatures.length,
            };

            setCoordinates({ ...coordsRef.current });

            // Detailed position tracking for diagnostics
            const dx = coordsRef.current.x - prevZ; // Track x change from last altitude as proxy
            const dy = coordsRef.current.y - prevZ; // Track y change
            log.debug(
              `Movement: pos=(${coordsRef.current.x.toFixed(2)}, ${coordsRef.current.y.toFixed(2)}, ${coordsRef.current.z.toFixed(2)}) ` +
              `vel=(${finalVx.toFixed(2)}, ${finalVy.toFixed(2)}) speed=${speed.toFixed(2)} m/s flowAng=${flowHeading.toFixed(0)}° alt=${altitude.toFixed(1)}m feat=${currFeatures.length} match=${matches.length}`
            );

            // Warn if heading is stuck at specific angles
            const roundedHeading = Math.round(flowHeading / 45) * 45;
            if (speed > 0.1 && Math.abs(flowHeading - roundedHeading) < 2) {
              log.warn(`[ANGLE-LOCK] Heading stuck at ${roundedHeading}° - optical flow may be constrained!`);
            }
          }
        }
      }

      prevFeaturesRef.current = currFeatures;
      prevTimestampRef.current = timestamp;
    } catch (err) {
      log.error(`Frame processing error: ${err}`);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [calibration, isNavigating]);

  useEffect(() => {
    if (isNavigating && calibration) {
      // Reset state for new flight
      prevFeaturesRef.current = [];
      prevTimestampRef.current = 0;
      kalmanFilterRef.current.reset(0, 0);
      startingAltitudeRef.current = 0; // Reset altitude reference to 0 at start
      coordsRef.current = { x: 0, y: 0, z: 0, heading: 0, yaw: 0, pitch: 0, roll: 0, vx: 0, vy: 0, vz: 0 };
      setCoordinates({ x: 0, y: 0, z: 0, heading: 0, yaw: 0, pitch: 0, roll: 0, vx: 0, vy: 0, vz: 0 });

      log.info('Starting frame processing (altitude relative to starting point)');
      // Start continuous frame processing
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else if (isNavigating && !calibration) {
      // Calibration not ready yet, wait
      log.debug('Waiting for calibration...');
    } else {
      stopCamera();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isNavigating, calibration, processFrame, stopCamera]);

  // Ensure stream state is set when camera is available
  useEffect(() => {
    if (isNavigating) {
      if (streamRef.current) {
        // Stream exists, sync to state
        setStream(streamRef.current);
      } else if (calibration) {
        // Stream is missing but calibration exists - restart camera
        log.info('Stream missing - restarting camera');
        startCamera();
      }
    } else {
      // Not navigating - clear stream
      setStream(null);
    }
  }, [isNavigating, calibration, startCamera]);

  // Start camera when navigating and calibration not ready
  useEffect(() => {
    if (isNavigating && !calibration) {
      log.info('Navigation started - initializing camera');
      startCamera();
    }
  }, [isNavigating, calibration, startCamera]);

  return {
    coordinates,
    opticalFlow,
    features,
    calibration,
    startCamera,
    stopCamera,
    stream,
  };
}
