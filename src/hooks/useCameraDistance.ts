import { useState, useEffect, useRef, useCallback } from 'react';
import { CameraDistanceState } from '../types';
import { log } from '../utils/debugLog';

export function useCameraDistance(
  isNavigating: boolean
): CameraDistanceState & { startCamera: () => Promise<void>; stopCamera: () => void } {
  const [distanceState, setDistanceState] = useState<CameraDistanceState>({
    distance: null,
    confidence: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  const estimateDistance = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(estimateDistance);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Simple brightness-based distance estimation
      // Brighter = closer, darker = farther
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;
      }

      const avgBrightness = totalBrightness / (canvas.width * canvas.height);

      // Map brightness (0-255) to distance (0.5-50m)
      // Brighter = closer
      const normalizedBrightness = avgBrightness / 255;
      const estimatedDistance = 50 - normalizedBrightness * 49.5; // 0.5-50m range

      // Confidence based on variance in brightness
      const variance = calculateBrightnessVariance(data, avgBrightness);
      const confidence = Math.min(variance / 50, 1); // normalized to 0-1

      setDistanceState({
        distance: estimatedDistance,
        confidence,
      });

      log.debug(`Camera distance: ${estimatedDistance.toFixed(1)}m (confidence: ${confidence.toFixed(2)})`);
    } catch (err) {
      log.error(`Distance estimation error: ${err}`);
    }

    animationFrameRef.current = requestAnimationFrame(estimateDistance);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        log.warn('Camera not available on this device');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 320 }, height: { ideal: 240 } },
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

      log.info('Camera started for distance estimation');

      // Start estimation loop after video is ready
      setTimeout(() => {
        if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA) {
          estimateDistance();
        }
      }, 1000);
    } catch (err) {
      log.error(`Camera access error: ${err}`);
    }
  }, [estimateDistance]);

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
    distance: distanceState.distance,
    confidence: distanceState.confidence,
    startCamera,
    stopCamera,
  };
}

function calculateBrightnessVariance(data: Uint8ClampedArray, avgBrightness: number): number {
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    variance += Math.pow(brightness - avgBrightness, 2);
  }
  return Math.sqrt(variance / (data.length / 4));
}
