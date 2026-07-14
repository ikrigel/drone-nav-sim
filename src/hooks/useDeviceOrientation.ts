import { useState, useEffect, useCallback } from 'react';
import type { DeviceOrientationState } from '../types';

export function useDeviceOrientation() {
  const [state, setState] = useState<DeviceOrientationState>({
    heading: null,
    pitch: null,
    roll: null,
    permissionState: 'prompt',
  });

  useEffect(() => {
    // iOS 13+: leave as 'prompt' — requestPermission() must be called from a user gesture
    // Non-iOS: assume permission is already granted
    if (typeof (DeviceOrientationEvent as any)?.requestPermission !== 'function') {
      setState(prev => ({ ...prev, permissionState: 'granted' }));
    }
  }, []);

  useEffect(() => {
    if (state.permissionState !== 'granted') return;

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      let heading = null;
      let pitch = null;
      let roll = null;

      // Heading (alpha)
      if (event.alpha !== null) {
        let h = event.alpha;
        // iOS uses webkitCompassHeading (0=north, clockwise)
        if ((event as any).webkitCompassHeading !== undefined && event.absolute) {
          h = (event as any).webkitCompassHeading;
        } else if (event.absolute) {
          // Android: derive from alpha when absolute=true
          h = event.alpha;
        }
        heading = h % 360; // normalize 0-360
      }

      // Pitch (beta): nose-up positive
      if (event.beta !== null) {
        pitch = event.beta; // -180 to 180
      }

      // Roll (gamma): right-roll positive
      if (event.gamma !== null) {
        roll = event.gamma; // -90 to 90
      }

      setState(prev => ({
        ...prev,
        heading,
        pitch,
        roll,
      }));
    };

    const handleAbsolute = (event: DeviceOrientationEvent) => {
      handleDeviceOrientation(event);
    };

    window.addEventListener('deviceorientationabsolute', handleAbsolute);
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleAbsolute);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [state.permissionState]);

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        setState(prev => ({ ...prev, permissionState: perm }));
        return perm === 'granted';
      } catch {
        return false;
      }
    } else {
      // Non-iOS: assume already granted
      setState(prev => ({ ...prev, permissionState: 'granted' }));
      return true;
    }
  }, []);

  return { ...state, requestPermission };
}
