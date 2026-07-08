import { useEffect } from 'react';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { useDeviceMotion } from './hooks/useDeviceMotion';
import { useCameraDistance } from './hooks/useCameraDistance';
import { useFlightSimulationReal } from './hooks/useFlightSimulationReal';
import { useAppSettings } from './hooks/useAppSettings';
import { FlightPlotter } from './components/FlightPlotter';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlsPanel } from './components/ControlsPanel';
import { MenuBar } from './components/MenuBar';
import { debugLogger } from './utils/debugLog';
import './App.css';

const APP_VERSION = '1.0.0';

export function App() {
  const orientationState = useDeviceOrientation();
  const motionState = useDeviceMotion();
  const cameraState = useCameraDistance(false);
  const appSettings = useAppSettings();

  const flight = useFlightSimulationReal({
    orientationState,
    motionState,
    cameraState,
  });

  // Sync app settings with debug logger
  useEffect(() => {
    debugLogger.setSettings(appSettings.settings.debug);
  }, [appSettings.settings.debug]);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    const fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px',
    }[appSettings.settings.fontSize];
    root.style.fontSize = fontSize;
  }, [appSettings.settings.fontSize]);

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
          position={flight.position}
          trackPoints={flight.trackPoints}
          heading={orientationState.heading}
        />
        <HUDOverlay
          heading={orientationState.heading}
          pitch={orientationState.pitch}
          roll={orientationState.roll}
          speed={flight.currentSpeed}
          altitude={flight.position.z}
          elapsedMs={flight.elapsedMs}
          totalDistance={flight.totalDistance}
          maxAltitude={flight.maxAltitude}
          accel={motionState}
        />
      </div>

      <ControlsPanel
        isFlying={flight.isFlying}
        orientationPermission={orientationState.permissionState}
        motionPermission={motionState.permissionState}
        onEnableSensors={() => {
          orientationState.requestPermission();
          motionState.requestPermission();
        }}
        onStart={flight.startFlight}
        onStop={flight.stopFlight}
        onReset={flight.resetFlight}
        onRecalibrate={flight.recalibrate}
      />
    </div>
  );
}
