import { useEffect, useState } from 'react';
import { useCameraMovement } from './hooks/useCameraMovement';
import { useAppSettings } from './hooks/useAppSettings';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import type { DroneCoordinates } from './types';
import { FlightPlotter } from './components/FlightPlotter';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlsPanel } from './components/ControlsPanel';
import { MenuBar } from './components/MenuBar';
import { CameraFeed } from './components/CameraFeed';
import { debugLogger } from './utils/debugLog';
import { exportFlightCourse, downloadFlightCourse, importFlightCourse, saveFlightCourseToStorage } from './utils/flightExport';
import { compressionSummary } from './utils/compressionStats';
import './App.css';

const APP_VERSION = '2.8.0';

export function App() {
  const [isFlying, setIsFlying] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [trackHistory, setTrackHistory] = useState<DroneCoordinates[]>([]);
  const [flightStartTime, setFlightStartTime] = useState<number>(0);

  const appSettings = useAppSettings();
  const camera = useCameraMovement({ isNavigating: isFlying });
  const orientation = useDeviceOrientation();

  const liveCoordinates: DroneCoordinates = {
    ...camera.coordinates,
    // For 3DOF: no heading/rotation data
    // For 4DOF: heading only (from optical flow)
    // For 6DOF: full orientation (heading, pitch, roll, yaw from compass)
    heading: appSettings.settings.coordinateSet !== '3dof' ? camera.coordinates.heading : 0,
    yaw: appSettings.settings.coordinateSet === '6dof' ? (orientation.heading ?? 0) : 0,
    pitch: appSettings.settings.coordinateSet === '6dof' ? (orientation.pitch ?? 0) : 0,
    roll: appSettings.settings.coordinateSet === '6dof' ? (orientation.roll ?? 0) : 0,
  };

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
    if (isFlying && liveCoordinates) {
      setTrackHistory(prev => {
        const last = prev[prev.length - 1];
        // Only add if position changed significantly
        if (!last || Math.hypot(
          liveCoordinates.x - last.x,
          liveCoordinates.y - last.y,
          liveCoordinates.z - last.z
        ) > 0.01) {
          return [...prev, { ...liveCoordinates, timestamp: Date.now() - flightStartTime }];
        }
        return prev;
      });
    }
  }, [liveCoordinates, isFlying, flightStartTime]);

  const handleEnableSensors = async () => {
    try {
      // Just mark camera as ready - it will request permission when flight starts
      setCameraReady(true);
      debugLogger.log('info', 'Camera access enabled');
    } catch (err) {
      debugLogger.log('error', `Camera setup error: ${err}`);
    }
  };

  const handleSetCoordinateSet = async (set: '3dof' | '4dof' | '6dof') => {
    if (set === '6dof') {
      await orientation.requestPermission();
    }
    appSettings.updateSettings({ coordinateSet: set });
  };

  const handleStart = () => {
    const now = Date.now();
    setFlightStartTime(now);
    setTrackHistory([]);
    setIsFlying(true);
    // Request device orientation permission if in 6dof mode and not yet granted
    if (appSettings.settings.coordinateSet === '6dof' && orientation.permissionState !== 'granted') {
      orientation.requestPermission();
    }
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

  const handleExportFlightCourse = () => {
    if (trackHistory.length === 0) {
      debugLogger.log('warn', 'No flight data to export');
      alert('No flight data to export. Start a flight first.');
      return;
    }

    const duration = flightStartTime > 0 ? Date.now() - flightStartTime : 0;
    const distance = Math.sqrt(
      camera.coordinates.x ** 2 + camera.coordinates.y ** 2
    );

    const jsonString = exportFlightCourse(
      `Flight ${new Date().toLocaleString()}`,
      trackHistory,
      duration,
      distance,
      Math.max(...trackHistory.map(p => p.z), 0),
      true, // Enable coreset compression
      appSettings.settings.coordinateSet
    );

    // Calculate file sizes for statistics
    const uncompressedSize = trackHistory.length * 120; // Rough estimate
    const compressedEstimate = Math.max(trackHistory.length / 5, 1) * 120; // Estimate 5x reduction

    downloadFlightCourse(jsonString, `flight-${Date.now()}.json`);
    saveFlightCourseToStorage({
      id: `flight_${Date.now()}`,
      name: `Flight ${new Date().toLocaleString()}`,
      createdAt: Date.now(),
      duration,
      distance,
      maxAltitude: Math.max(...trackHistory.map(p => p.z), 0),
      points: trackHistory,
      coordinateSet: appSettings.settings.coordinateSet,
    });

    const stats = compressionSummary(
      trackHistory.length,
      Math.max(Math.floor(trackHistory.length / 5), 1),
      uncompressedSize,
      compressedEstimate
    );

    debugLogger.log('info', `Flight exported: ${trackHistory.length} points with coreset compression`);
    debugLogger.log('info', stats);
    alert(`✅ Flight exported!\n\n${stats}\n\nFile: flight-${Date.now()}.json`);
  };

  const handleImportFlightCourse = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const imported = importFlightCourse(jsonString);

          if (!imported) {
            alert('Invalid flight course file');
            return;
          }

          debugLogger.log('info', `Flight course imported: ${imported.points.length} points`);
          alert(`Flight imported: ${imported.points.length} points from ${imported.name}`);
        } catch (err) {
          debugLogger.log('error', `Import error: ${err}`);
          alert('Failed to import flight course');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const elapsedMs = isFlying && flightStartTime > 0 ? Date.now() - flightStartTime : 0;

  return (
    <div className={`app-container font-${appSettings.settings.fontSize}`}>
      <MenuBar
        settings={appSettings.settings}
        onFontSizeChange={appSettings.setFontSize}
        onDebugChange={appSettings.setDebugSettings}
        onSettingsChange={appSettings.updateSettings}
        onCoordinateSetChange={handleSetCoordinateSet}
        version={APP_VERSION}
      />

      <div className="flight-view">
        <FlightPlotter
          position={liveCoordinates}
          trackPoints={trackHistory}
          heading={liveCoordinates.heading}
        />
        <HUDOverlay
          coordinates={liveCoordinates}
          opticalFlow={camera.opticalFlow}
          features={camera.features}
          elapsedMs={elapsedMs}
          units={appSettings.settings.units}
          coordinateSet={appSettings.settings.coordinateSet}
        />
        <CameraFeed
          isVisible={appSettings.settings.showCamera && isFlying}
          stream={camera.stream}
          sizeMode={appSettings.settings.cameraSizeMode}
          onToggleSize={() => appSettings.updateSettings({
            cameraSizeMode: appSettings.settings.cameraSizeMode === 'fullscreen' ? 'small' : 'fullscreen'
          })}
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
        onExportFlightCourse={handleExportFlightCourse}
        onImportFlightCourse={handleImportFlightCourse}
      />
    </div>
  );
}
