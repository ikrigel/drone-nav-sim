import type { FlightState, TrackPoint } from '../types';
import './HUDOverlay.css';

interface HUDOverlayProps {
  position: FlightState;
  heading: number | null;
  speed: number;
  elapsedMs: number;
  totalDistance: number;
  maxAltitude: number;
}

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function getCompassLabel(heading: number): string {
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
  position,
  heading,
  speed,
  elapsedMs,
  totalDistance,
  maxAltitude,
}: HUDOverlayProps) {
  return (
    <div className="hud-overlay">
      <div className="hud-top">
        <div className="hud-stat">
          <div className="hud-label">HEADING</div>
          <div className="hud-value">
            {heading !== null ? `${heading.toFixed(0)}°` : '---°'}
            <span className="hud-compass">{getCompassLabel(heading)}</span>
          </div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">SPEED</div>
          <div className="hud-value">{speed.toFixed(1)} m/s</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">ALTITUDE</div>
          <div className="hud-value">{position.z.toFixed(1)} m</div>
        </div>
      </div>

      <div className="hud-bottom">
        <div className="hud-stat">
          <div className="hud-label">TIME</div>
          <div className="hud-value">{formatTime(elapsedMs)}</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">DISTANCE</div>
          <div className="hud-value">{totalDistance.toFixed(1)} m</div>
        </div>
        <div className="hud-stat">
          <div className="hud-label">MAX ALT</div>
          <div className="hud-value">{maxAltitude.toFixed(1)} m</div>
        </div>
      </div>
    </div>
  );
}
