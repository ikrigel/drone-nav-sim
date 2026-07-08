import type { DroneCoordinates, OpticalFlowVector, CameraFeature } from '../types';
import { convertValue, getUnitLabel } from '../utils/unitConversion';
import './HUDOverlay.css';

interface HUDOverlayProps {
  coordinates: DroneCoordinates;
  opticalFlow: OpticalFlowVector;
  features: CameraFeature[];
  elapsedMs: number;
  units?: 'metric' | 'imperial';
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
  units = 'metric',
}: HUDOverlayProps) {
  const speed = Math.sqrt(coordinates.vx ** 2 + coordinates.vy ** 2);
  const distance = Math.sqrt(coordinates.x ** 2 + coordinates.y ** 2);

  // Convert values based on unit system
  const displayAltitude = convertValue(coordinates.z, 'meters', units);
  const displayX = convertValue(coordinates.x, 'meters', units);
  const displayY = convertValue(coordinates.y, 'meters', units);
  const displayDistance = convertValue(distance, 'meters', units);
  const displaySpeed = convertValue(speed, 'ms', units);
  const displayVx = convertValue(coordinates.vx, 'ms', units);
  const displayVy = convertValue(coordinates.vy, 'ms', units);

  const distanceUnit = getUnitLabel('distance', units);
  const speedUnit = getUnitLabel('speed', units);

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
          <div className="hud-value">{displaySpeed.toFixed(2)} {speedUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ALT</div>
          <div className="hud-value">{displayAltitude.toFixed(1)} {distanceUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">X</div>
          <div className="hud-value">{displayX.toFixed(1)} {distanceUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">Y</div>
          <div className="hud-value">{displayY.toFixed(1)} {distanceUnit}</div>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-stat">
          <div className="hud-label">TIME</div>
          <div className="hud-value">{formatTime(elapsedMs)}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">DIST</div>
          <div className="hud-value">{displayDistance.toFixed(1)} {distanceUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">FLOW</div>
          <div className="hud-value">{opticalFlow.magnitude.toFixed(1)} px</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">VX</div>
          <div className="hud-value">{displayVx.toFixed(2)} {speedUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">VY</div>
          <div className="hud-value">{displayVy.toFixed(2)} {speedUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">FEAT</div>
          <div className="hud-value">{features.length} pts</div>
        </div>
      </div>
    </div>
  );
}
