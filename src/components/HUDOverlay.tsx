import type { DroneCoordinates, OpticalFlowVector, CameraFeature } from '../types';
import './HUDOverlay.css';

interface HUDOverlayProps {
  coordinates: DroneCoordinates;
  opticalFlow: OpticalFlowVector;
  features: CameraFeature[];
  elapsedMs: number;
}

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function getCompassLabel(heading: number): string {
  const normalized = ((heading % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return COMPASS_LABELS[index];
}

function formatTime(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function HUDOverlay({
  coordinates,
  opticalFlow,
  features,
  elapsedMs,
}: HUDOverlayProps) {
  const speed = Math.sqrt(coordinates.vx ** 2 + coordinates.vy ** 2);
  const distance = Math.sqrt(coordinates.x ** 2 + coordinates.y ** 2);

  return (
    <div className="hud-overlay">
      <div className="hud-top">
        <div className="hud-stat">
          <div className="hud-label">HDG</div>
          <div className="hud-value">
            {`${coordinates.heading.toFixed(0)}°`}
            <span className="hud-compass">{getCompassLabel(coordinates.heading)}</span>
          </div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">SPD</div>
          <div className="hud-value">{speed.toFixed(2)} m/s</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ALT</div>
          <div className="hud-value">{coordinates.z.toFixed(1)} m</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">X</div>
          <div className="hud-value">{coordinates.x.toFixed(1)} m</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">Y</div>
          <div className="hud-value">{coordinates.y.toFixed(1)} m</div>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-stat">
          <div className="hud-label">TIME</div>
          <div className="hud-value">{formatTime(elapsedMs)}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">DIST</div>
          <div className="hud-value">{distance.toFixed(1)} m</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">FLOW</div>
          <div className="hud-value">{opticalFlow.magnitude.toFixed(1)} px</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">VX</div>
          <div className="hud-value">{coordinates.vx.toFixed(2)} m/s</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">VY</div>
          <div className="hud-value">{coordinates.vy.toFixed(2)} m/s</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">FEAT</div>
          <div className="hud-value">{features.length} pts</div>
        </div>
      </div>
    </div>
  );
}
