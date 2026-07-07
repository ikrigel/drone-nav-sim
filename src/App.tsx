import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import { useFlightSimulation } from './hooks/useFlightSimulation';
import { FlightPlotter } from './components/FlightPlotter';
import { HUDOverlay } from './components/HUDOverlay';
import { ControlsPanel } from './components/ControlsPanel';
import './App.css';

export function App() {
  const sensorState = useDeviceOrientation();
  const flight = useFlightSimulation({ sensorState });

  return (
    <div className="app-container">
      <div className="flight-view">
        <FlightPlotter
          position={flight.position}
          trackPoints={flight.trackPoints}
          heading={sensorState.heading}
        />
        <HUDOverlay
          position={flight.position}
          heading={sensorState.heading}
          speed={flight.currentSpeed}
          elapsedMs={flight.elapsedMs}
          totalDistance={flight.totalDistance}
          maxAltitude={flight.maxAltitude}
        />
      </div>
      <ControlsPanel
        isFlying={flight.isFlying}
        sensorPermission={sensorState.permissionState}
        onEnableSensors={sensorState.requestPermission}
        onStart={flight.startFlight}
        onStop={flight.stopFlight}
        onReset={flight.resetFlight}
        onRecalibrate={flight.recalibrate}
      />
    </div>
  );
}
