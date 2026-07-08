import './ControlsPanel.css';

interface ControlsPanelProps {
  isFlying: boolean;
  orientationPermission: 'granted' | 'denied' | 'prompt';
  motionPermission: 'granted' | 'denied' | 'prompt';
  onEnableSensors: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onRecalibrate: () => void;
}

export function ControlsPanel({
  isFlying,
  orientationPermission,
  motionPermission,
  onEnableSensors,
  onStart,
  onStop,
  onReset,
  onRecalibrate,
}: ControlsPanelProps) {
  const sensorsReady =
    orientationPermission === 'granted' && motionPermission === 'granted';
  const sensorsPending =
    orientationPermission === 'prompt' || motionPermission === 'prompt';
  const sensorsDenied =
    orientationPermission === 'denied' || motionPermission === 'denied';

  return (
    <div className="controls-panel">
      {sensorsPending && (
        <button className="btn btn-primary" onClick={onEnableSensors}>
          Enable Sensors
        </button>
      )}

      {sensorsDenied && (
        <div className="warning">
          Sensor permissions denied. Please enable orientation and motion sensors.
        </div>
      )}

      {sensorsReady && !isFlying && (
        <button className="btn btn-primary" onClick={onStart}>
          Start Flight
        </button>
      )}

      {isFlying && (
        <>
          <button className="btn btn-danger" onClick={onStop}>
            Stop Flight
          </button>
          <button className="btn btn-secondary" onClick={onRecalibrate}>
            Recalibrate
          </button>
        </>
      )}

      {!isFlying && sensorsReady && (
        <button className="btn btn-secondary" onClick={onReset}>
          Reset
        </button>
      )}
    </div>
  );
}
