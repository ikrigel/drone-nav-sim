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
      if (!navigator.mediaDevices?.getUserMedia) {
        log.warn('Camera not available');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;

      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
        videoRef.current.style.display = 'none';
        document.body.appendChild(videoRef.current);
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.style.display = 'none';
        document.body.appendChild(canvasRef.current);
      }

      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // Wait for video to be ready
      await new Promise(resolve => {
        const checkReady = () => {
          if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
            resolve(true);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });

      // Initialize calibration
      const calib = loadOrCreateCalibration(videoRef.current);
      setCalibration(calib);

      log.info('Camera started - calibration loaded');

      // Start processing loop
      processFrame();
    } catch (err) {
      log.error(`Camera error: ${err}`);
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
    if (!videoRef.current || !canvasRef.current || !calibration) {
      if (isNavigating) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
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

          // Update velocity
          const vx = Math.cos(flow.angle) * speed;
          const vy = Math.sin(flow.angle) * speed;

          coordsRef.current = {
            ...coordsRef.current,
            x: coordsRef.current.x + vx * dtSeconds,
            y: coordsRef.current.y + vy * dtSeconds,
            z: altitude,
            heading: flow.angle * (180 / Math.PI),
            vx,
            vy,
            vz: 0,
          };

          setCoordinates({ ...coordsRef.current });

          log.debug(
            `Movement: pos=(${coordsRef.current.x.toFixed(2)}, ${coordsRef.current.y.toFixed(2)}, ${coordsRef.current.z.toFixed(2)}) ` +
              `vel=(${vx.toFixed(2)}, ${vy.toFixed(2)}) speed=${speed.toFixed(2)} m/s alt=${altitude.toFixed(1)}m`
          );
        }
      }

      prevFeaturesRef.current = currFeatures;
      prevTimestampRef.current = timestamp;
    } catch (err) {
      log.error(`Frame processing error: ${err}`);
    }

    if (isNavigating) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [calibration, isNavigating]);

  useEffect(() => {
    if (isNavigating) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isNavigating, startCamera, stopCamera]);

  return {
    coordinates,
    opticalFlow,
    features,
    calibration,
    startCamera,
    stopCamera,
  };
}
