import { useState, useEffect, useRef, useCallback } from 'react';
import { DeviceMotionState } from '../types';
import { log } from '../utils/debugLog';

export function useDeviceMotion(): DeviceMotionState & {
  requestPermission: () => Promise<boolean>;
  permissionState: 'granted' | 'denied' | 'prompt';
} {
  const [motionState, setMotionState] = useState<DeviceMotionState>({
    accelX: null,
    accelY: null,
    accelZ: null,
    rotationRateAlpha: null,
    rotationRateBeta: null,
    rotationRateGamma: null,
  });

  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const hasRequestedRef = useRef(false);

  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    const acc = event.acceleration;
    const rot = event.rotationRate;

    setMotionState({
      accelX: acc?.x ?? null,
      accelY: acc?.y ?? null,
      accelZ: acc?.z ?? null,
      rotationRateAlpha: rot?.alpha ?? null,
      rotationRateBeta: rot?.beta ?? null,
      rotationRateGamma: rot?.gamma ?? null,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [handleDeviceMotion]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (hasRequestedRef.current) return permissionState === 'granted';
    hasRequestedRef.current = true;

    // iOS 13+ requires explicit permission
    if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        log.info(`DeviceMotion permission: ${permission}`);
        setPermissionState(permission === 'granted' ? 'granted' : 'denied');
        return permission === 'granted';
      } catch (err) {
        log.error(`DeviceMotion permission error: ${err}`);
        setPermissionState('denied');
        return false;
      }
    } else {
      // Android and older iOS - permission already implicitly granted
      log.info('DeviceMotion available (no explicit permission needed)');
      setPermissionState('granted');
      return true;
    }
  }, [permissionState]);

  return {
    ...motionState,
    requestPermission,
    permissionState,
  };
}
