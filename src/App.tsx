import { useEffect, useState } from 'react';
import { useCameraMovement } from './hooks/useCameraMovement';
import { useAppSettings } from './hooks/useAppSettings';
import { FlightPlotter } from './components/FlightPlotter';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlsPanel } from './components/ControlsPanel';
import { MenuBar } from './components/MenuBar';
import { debugLogger } from './utils/debugLog';
import './App.css';

const APP_VERSION = '2.0.0';

export function App() {
  const [isFlying, setIsFlying] = useState(false);
  const [trackHistory, setTrackHistory] = useState<Array<{ x: number; y: number; z: number }>>([]);

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

  // Track position history
  useEffect(() => {
    if (isFlying) {
      setTrackHistory(prev => [...prev, camera.coordinates]);
    }
  }, [camera.coordinates, isFlying]);

  const handleStart = () => {
    setTrackHistory([]);
    setIsFlying(true);
  };

  const handleStop = () => {
    setIsFlying(false);
  };

  const handleReset = () => {
    setTrackHistory([]);
    setIsFlying(false);
  };

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
          elapsedMs={isFlying ? Date.now() - (window as any).__flightStartTime || 0 : 0}
        />
      </div>

      <ControlsPanel
        isFlying={isFlying}
        orientationPermission="granted"
        motionPermission="granted"
        onEnableSensors={() => {
          (window as any).__flightStartTime = Date.now();
          handleStart();
        }}
        onStart={() => {
          (window as any).__flightStartTime = Date.now();
          handleStart();
        }}
        onStop={handleStop}
        onReset={handleReset}
        onRecalibrate={() => {
          /* Camera recalibration can be added here */
        }}
      />
    </div>
  );
}
