import { useEffect, useRef } from 'react';
import type { TrackPoint, FlightState } from '../types';

interface FlightPlotterProps {
  position: FlightState;
  trackPoints: TrackPoint[];
  heading: number | null;
}

export function FlightPlotter({ position, trackPoints, heading }: FlightPlotterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Calculate scale (pixels per meter)
    let scale = 1;
    if (trackPoints.length > 0) {
      const bounds = getBounds(trackPoints);
      const maxDim = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
      if (maxDim > 0) {
        scale = (Math.min(width, height) * 0.8) / maxDim;
      }
    }

    // Draw range rings
    drawRangeRings(ctx, centerX, centerY, width, height, scale);

    // Draw track trail
    if (trackPoints.length > 1) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const first = trackPoints[0];
      ctx.moveTo(centerX + (first.y - position.y) * scale, centerY + (first.x - position.x) * scale);
      for (let i = 1; i < trackPoints.length; i++) {
        const p = trackPoints[i];
        ctx.lineTo(centerX + (p.y - position.y) * scale, centerY + (p.x - position.x) * scale);
      }
      ctx.stroke();
    }

    // Draw current position marker (arrow pointing in heading direction)
    drawMarker(ctx, centerX, centerY, heading);

    // Draw altitude indicator
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.fillText(`ALT: ${position.z.toFixed(1)}m`, 10, height - 10);
  }, [position, trackPoints, heading]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
        display: 'block',
      }}
    />
  );
}

function getBounds(points: TrackPoint[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY };
}

function drawRangeRings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  scale: number
) {
  const maxRadius = (Math.min(width, height) / 2) * 0.9;
  const ringInterval = 50; // meters per ring
  const ringsToShow = Math.ceil(maxRadius / (ringInterval * scale));

  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.font = '10px monospace';
  ctx.fillStyle = '#666';

  for (let i = 1; i <= ringsToShow; i++) {
    const radius = ringInterval * i * scale;
    if (radius > maxRadius) break;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(`${ringInterval * i}m`, centerX + radius + 2, centerY - 2);
  }

  // Center crosshair
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 10, centerY);
  ctx.lineTo(centerX + 10, centerY);
  ctx.moveTo(centerX, centerY - 10);
  ctx.lineTo(centerX, centerY + 10);
  ctx.stroke();
}

function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number | null) {
  const size = 12;

  if (heading !== null) {
    // Rotate arrow based on heading
    const headingRad = (heading * Math.PI) / 180;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(headingRad);

    // Arrow body (pointing up)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size / 2, size / 2);
    ctx.lineTo(0, size / 3);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fill();

    // Arrow outline
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  } else {
    // No heading: draw a circle
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
