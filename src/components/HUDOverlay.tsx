import type { DroneCoordinates, OpticalFlowVector, CameraFeature } from '../types';
import { convertValue, getUnitLabel } from '../utils/unitConversion';
import { DISPLAY_PRECISION } from '../utils/precision';
import './HUDOverlay.css';

interface HUDOverlayProps {
  coordinates: DroneCoordinates;
  opticalFlow: OpticalFlowVector;
  features: CameraFeature[];
  elapsedMs: number;
  units?: 'metric' | 'imperial';
  coordinateSet?: '3dof' | '4dof' | '6dof';
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

function formatDegrees(deg: number): string {
  // Google Maps style: d°m's.ssss" format with 6 decimal digit precision
  // 6 decimal places in degrees = 0.000001° ≈ 0.11m at equator
  // In DMS format: show seconds with 4 decimal places (equivalent precision)
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;

  // Convert 6 decimal places in degrees to seconds precision
  // 0.000001° * 3600 seconds/degree = 0.0036 seconds precision = 0.004 (4 decimals)
  const secondsFormatted = seconds.toFixed(4);
  return `${degrees}°${minutes}'${secondsFormatted}"`;
}

export function HUDOverlay({
  coordinates,
  opticalFlow,
  features,
  elapsedMs,
  units = 'metric',
  coordinateSet = '4dof',
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
        {coordinateSet !== '3dof' && (
          <div className="hud-stat">
            <div className="hud-label">HDG</div>
            <div className="hud-value">
              {`${coordinates.heading.toFixed(DISPLAY_PRECISION)}°`}
              <span className="hud-compass">{getCompassLabel(coordinates.heading)}</span>
            </div>
          </div>
        )}
        <div className="hud-stat">
          <div className="hud-label">SPD</div>
          <div className="hud-value">{displaySpeed.toFixed(DISPLAY_PRECISION)} {speedUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ALT</div>
          <div className="hud-value">{displayAltitude.toFixed(DISPLAY_PRECISION)} {distanceUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">X</div>
          <div className="hud-value">{displayX.toFixed(DISPLAY_PRECISION)} {distanceUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">Y</div>
          <div className="hud-value">{displayY.toFixed(DISPLAY_PRECISION)} {distanceUnit}</div>
        </div>
        {coordinateSet === '6dof' && (
          <>
            <div className="hud-stat">
              <div className="hud-label">PITCH</div>
              <div className="hud-value" title={`${coordinates.pitch.toFixed(DISPLAY_PRECISION)}°`}>{formatDegrees(coordinates.pitch)}</div>
            </div>
            <div className="hud-stat">
              <div className="hud-label">ROLL</div>
              <div className="hud-value" title={`${coordinates.roll.toFixed(DISPLAY_PRECISION)}°`}>{formatDegrees(coordinates.roll)}</div>
            </div>
            <div className="hud-stat">
              <div className="hud-label">YAW</div>
              <div className="hud-value" title={`${coordinates.yaw.toFixed(DISPLAY_PRECISION)}°`}>{formatDegrees(coordinates.yaw)}</div>
            </div>
          </>
        )}
      </div>

      <div className="hud-bottom">
        <div className="hud-stat">
          <div className="hud-label">TIME</div>
          <div className="hud-value">{formatTime(elapsedMs)}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">DIST</div>
          <div className="hud-value">{displayDistance.toFixed(DISPLAY_PRECISION)} {distanceUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">FLOW</div>
          <div className="hud-value">{opticalFlow.magnitude.toFixed(DISPLAY_PRECISION)} px</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">VX</div>
          <div className="hud-value">{displayVx.toFixed(DISPLAY_PRECISION)} {speedUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">VY</div>
          <div className="hud-value">{displayVy.toFixed(DISPLAY_PRECISION)} {speedUnit}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">FEAT</div>
          <div className="hud-value">{features.length} pts</div>
        </div>
      </div>
    </div>
  );
}
