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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);
  const prevFeaturesRef = useRef<CameraFeature[]>([]);
  const prevTimestampRef = useRef<number>(0);
  const coordsRef = useRef<DroneCoordinates>({
    x: 0,
    y: 0,
    z: 0,
    heading: 0,
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

      // Calculate optical flow from feature matching
      if (prevFeaturesRef.current.length > 0) {
        const matches = matchFeatures(prevFeaturesRef.current, currFeatures, 100);
        const flow = calculateOpticalFlow(matches);
        setOpticalFlow(flow);

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
            const speed = opticalFlowToSpeed(
              flow.magnitude,
              dtSeconds,
              altitude,
              calibration.focalLengthY
            );

            // Update velocity based on flow angle and device heading
            const flowHeading = (flow.angle * 180 / Math.PI + 360) % 360;
            const vx = Math.sin((flowHeading * Math.PI) / 180) * speed;
            const vy = Math.cos((flowHeading * Math.PI) / 180) * speed;

            // Update position
            coordsRef.current = {
              ...coordsRef.current,
              x: coordsRef.current.x + vx * dtSeconds,
              y: coordsRef.current.y + vy * dtSeconds,
              z: Math.max(0, altitude),
              heading: flowHeading,
              vx,
              vy,
              vz: 0,
            };

            setCoordinates({ ...coordsRef.current });

            log.debug(
              `Movement: pos=(${coordsRef.current.x.toFixed(2)}, ${coordsRef.current.y.toFixed(2)}, ${coordsRef.current.z.toFixed(2)}) ` +
              `vel=(${vx.toFixed(2)}, ${vy.toFixed(2)}) speed=${speed.toFixed(2)} m/s alt=${altitude.toFixed(1)}m features=${currFeatures.length}`
            );
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
      coordsRef.current = { x: 0, y: 0, z: 0, heading: 0, vx: 0, vy: 0, vz: 0 };
      setCoordinates({ x: 0, y: 0, z: 0, heading: 0, vx: 0, vy: 0, vz: 0 });

      log.info('Starting frame processing');
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

  // Separate effect to start camera when navigating
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
  };
}
