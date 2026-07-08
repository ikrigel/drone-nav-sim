import { useEffect, useState } from 'react';
import { useCameraMovement } from './hooks/useCameraMovement';
import { useAppSettings } from './hooks/useAppSettings';
import { FlightPlotter } from './components/FlightPlotter';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlsPanel } from './components/ControlsPanel';
import { MenuBar } from './components/MenuBar';
import { debugLogger } from './utils/debugLog';
import './App.css';

const APP_VERSION = '2.1.0';

export function App() {
  const [isFlying, setIsFlying] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [trackHistory, setTrackHistory] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const [flightStartTime, setFlightStartTime] = useState<number>(0);

  const appSettings = useAppSettings();
  const camera = useCameraMovement({ isNavigating: isFlying });

  // Sync app settings with debug logger
  useEffect(() => {
    debugLogger.setSettings(appSettings.settings.debug);
  }, [appSettings.settings.debug]);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xl: '20px',
      xxl: '24px',
    };
    root.style.fontSize = fontSizeMap[appSettings.settings.fontSize];
  }, [appSettings.settings.fontSize]);

  // Track position history in real-time
  useEffect(() => {
    if (isFlying && camera.coordinates) {
      setTrackHistory(prev => {
        const last = prev[prev.length - 1];
        // Only add if position changed significantly
        if (!last || Math.hypot(
          camera.coordinates.x - last.x,
          camera.coordinates.y - last.y,
          camera.coordinates.z - last.z
        ) > 0.01) {
          return [...prev, {
            x: camera.coordinates.x,
            y: camera.coordinates.y,
            z: camera.coordinates.z
          }];
        }
        return prev;
      });
    }
  }, [camera.coordinates, isFlying]);

  const handleEnableSensors = async () => {
    try {
      // Just mark camera as ready - it will request permission when flight starts
      setCameraReady(true);
      debugLogger.log('info', 'Camera access enabled');
    } catch (err) {
      debugLogger.log('error', `Camera setup error: ${err}`);
    }
  };

  const handleStart = () => {
    const now = Date.now();
    setFlightStartTime(now);
    setTrackHistory([]);
    setIsFlying(true);
    debugLogger.log('info', 'Flight started - camera tracking active');
  };

  const handleStop = () => {
    setIsFlying(false);
    const duration = Date.now() - flightStartTime;
    debugLogger.log('info', `Flight stopped - duration: ${(duration / 1000).toFixed(1)}s`);
  };

  const handleReset = () => {
    setTrackHistory([]);
    setIsFlying(false);
    setFlightStartTime(0);
    debugLogger.log('info', 'Flight reset');
  };

  const elapsedMs = isFlying && flightStartTime > 0 ? Date.now() - flightStartTime : 0;

  return (
    <div className={`app-container font-${appSettings.settings.fontSize}`}>
      <MenuBar
        settings={appSettings.settings}
        onFontSizeChange={appSettings.setFontSize}
        onDebugChange={appSettings.setDebugSettings}
        version={APP_VERSION}
      />

      <div className="flight-view">
        <FlightPlotter
          position={camera.coordinates}
          trackPoints={trackHistory}
          heading={camera.coordinates.heading}
        />
        <HUDOverlay
          coordinates={camera.coordinates}
          opticalFlow={camera.opticalFlow}
          features={camera.features}
          elapsedMs={elapsedMs}
        />
      </div>

      <ControlsPanel
        isFlying={isFlying}
        orientationPermission={cameraReady ? 'granted' : 'prompt'}
        motionPermission={cameraReady ? 'granted' : 'prompt'}
        onEnableSensors={handleEnableSensors}
        onStart={handleStart}
        onStop={handleStop}
        onReset={handleReset}
        onRecalibrate={() => {
          debugLogger.log('info', 'Camera recalibrated');
        }}
      />
    </div>
  );
}
