import './ControlsPanel.css';

interface ControlsPanelProps {
  isFlying: boolean;
  sensorPermission: 'granted' | 'denied' | 'prompt';
  onEnableSensors: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onRecalibrate: () => void;
}

export function ControlsPanel({
  isFlying,
  sensorPermission,
  onEnableSensors,
  onStart,
  onStop,
  onReset,
  onRecalibrate,
}: ControlsPanelProps) {
  return (
    <div className="controls-panel">
      {sensorPermission === 'prompt' && (
        <button className="btn btn-primary" onClick={onEnableSensors}>
          Enable Sensors
        </button>
      )}

      {sensorPermission === 'denied' && (
        <div className="warning">Device orientation permission denied</div>
      )}

      {sensorPermission === 'granted' && !isFlying && (
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

      {!isFlying && <button className="btn btn-secondary" onClick={onReset}>
        Reset
      </button>}
    </div>
  );
}
