import type { DeviceMotionState } from '../types';
import './HUDOverlay.css';

interface HUDOverlayProps {
  heading: number | null;
  pitch: number | null;
  roll: number | null;
  speed: number;
  altitude: number;
  elapsedMs: number;
  totalDistance: number;
  maxAltitude: number;
  accel: DeviceMotionState;
}

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function getCompassLabel(heading: number | null): string {
  if (heading === null) return '---';
  const index = Math.round((heading % 360) / 45) % 8;
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
  heading,
  pitch,
  roll,
  speed,
  altitude,
  elapsedMs,
  totalDistance,
  maxAltitude,
  accel,
}: HUDOverlayProps) {
  return (
    <div className="hud-overlay">
      <div className="hud-top">
        <div className="hud-stat">
          <div className="hud-label">HDG</div>
          <div className="hud-value">
            {heading !== null ? `${heading.toFixed(0)}°` : '---°'}
            <span className="hud-compass">{getCompassLabel(heading)}</span>
          </div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">PITCH</div>
          <div className="hud-value">{pitch !== null ? `${pitch.toFixed(0)}°` : '---°'}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ROLL</div>
          <div className="hud-value">{roll !== null ? `${roll.toFixed(0)}°` : '---°'}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">SPD</div>
          <div className="hud-value">{speed.toFixed(1)} m/s</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ALT</div>
          <div className="hud-value">{altitude.toFixed(1)} m</div>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-stat">
          <div className="hud-label">TIME</div>
          <div className="hud-value">{formatTime(elapsedMs)}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">DIST</div>
          <div className="hud-value">{totalDistance.toFixed(1)} m</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">MAXALT</div>
          <div className="hud-value">{maxAltitude.toFixed(1)} m</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ACC-X</div>
          <div className="hud-value">{accel.accelX !== null ? `${accel.accelX.toFixed(1)}` : '---'}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ACC-Y</div>
          <div className="hud-value">{accel.accelY !== null ? `${accel.accelY.toFixed(1)}` : '---'}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ACC-Z</div>
          <div className="hud-value">{accel.accelZ !== null ? `${accel.accelZ.toFixed(1)}` : '---'}</div>
        </div>
      </div>
    </div>
  );
}
