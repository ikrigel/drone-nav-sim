import { useEffect, useRef, useState } from 'react';
import type { DroneCoordinates } from '../types';
import { DISPLAY_PRECISION } from '../utils/precision';
import './FlightPlotter.css';

interface FlightPlotterProps {
  position: DroneCoordinates;
  trackPoints: Array<{ x: number; y: number; z: number }>;
  heading: number;
}

export function FlightPlotter({ position, trackPoints, heading }: FlightPlotterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<() => void>(() => {});
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100 px/m (1cm = 1px), 2 = 200 px/m, etc.

  useEffect(() => {
    drawRef.current = () => {
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
      // Default: 100 px/m (1 cm = 1 pixel for centimeter-level accuracy)
      // User can zoom in (1.5x, 2x, 3x) or out (0.5x, 0.33x)
      const baseScale = 100; // centimeter-level accuracy: 1cm = 1px
      let scale = baseScale * zoomLevel;

      // Draw range rings
      drawRangeRings(ctx, centerX, centerY, width, height, scale);

      // Draw track trail
      if (trackPoints.length > 0) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const first = trackPoints[0];
        // Debug: log coordinate spread to diagnose straight-line issue
        const xSpread = Math.max(...trackPoints.map(p => p.x)) - Math.min(...trackPoints.map(p => p.x));
        const ySpread = Math.max(...trackPoints.map(p => p.y)) - Math.min(...trackPoints.map(p => p.y));
        if (trackPoints.length > 10) {
          console.log(`[MAP] Tracks: ${trackPoints.length} points | X spread: ${xSpread.toFixed(3)}m | Y spread: ${ySpread.toFixed(3)}m | Current pos: (${position.x.toFixed(3)}, ${position.y.toFixed(3)})`);
        }
        ctx.moveTo(centerX + (first.y - position.y) * scale, centerY + (first.x - position.x) * scale);
        for (let i = 1; i < trackPoints.length; i++) {
          const p = trackPoints[i];
          ctx.lineTo(centerX + (p.y - position.y) * scale, centerY + (p.x - position.x) * scale);
        }
        ctx.stroke();

        // Draw waypoints as circles
        ctx.fillStyle = '#00ff00';
        for (let i = 0; i < trackPoints.length; i += Math.max(1, Math.floor(trackPoints.length / 20))) {
          const p = trackPoints[i];
          const x = centerX + (p.y - position.y) * scale;
          const y = centerY + (p.x - position.x) * scale;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw starting point marker (blue dot)
        if (trackPoints.length > 0) {
          const start = trackPoints[0];
          const startX = centerX + (start.y - position.y) * scale;
          const startY = centerY + (start.x - position.x) * scale;
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(startX, startY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw current position marker (arrow pointing in heading direction)
      drawMarker(ctx, centerX, centerY, heading);

      // Draw altitude and coordinates
      const altFontSize = Math.max(10, Math.min(14, width / 50));
      ctx.fillStyle = '#aaa';
      ctx.font = `${altFontSize}px monospace`;
      ctx.fillText(`ALT: ${position.z.toFixed(DISPLAY_PRECISION)}m`, 10, height - 10);
      ctx.fillText(`POS: (${position.x.toFixed(DISPLAY_PRECISION)}, ${position.y.toFixed(DISPLAY_PRECISION)})m`, 10, height - 25);
    };
    drawRef.current();
  }, [position, trackPoints, heading, zoomLevel]);

  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver(() => drawRef.current());
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <canvas
        ref={canvasRef}
        style={{
          flex: 1,
          backgroundColor: '#1a1a2e',
          display: 'block',
        }}
      />
      <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6, zIndex: 50 }}>
        <button
          onClick={() => setZoomLevel(prev => Math.max(0.33, prev - 0.5))}
          style={{
            background: 'rgba(0,255,0,0.2)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          title="Zoom out"
        >
          −
        </button>
        <div style={{ color: '#00ff00', padding: '4px 8px', fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>
          {(zoomLevel * 100).toFixed(0)}%
        </div>
        <button
          onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.5))}
          style={{
            background: 'rgba(0,255,0,0.2)',
            border: '1px solid #00ff00',
            color: '#00ff00',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
          title="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
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
  // Adaptive ring interval: smaller distances at high zoom (100px/m), larger at low zoom
  // Goal: 3-5 rings visible at any zoom level
  let ringInterval = 50; // meters per ring
  if (scale >= 100) ringInterval = 0.5; // centimeter-level: show 0.5m rings (50px each)
  else if (scale >= 50) ringInterval = 1;
  else if (scale >= 20) ringInterval = 2;
  else if (scale >= 10) ringInterval = 5;
  const ringsToShow = Math.ceil(maxRadius / (ringInterval * scale));

  // Responsive font size based on canvas width
  const fontSize = Math.max(8, Math.min(12, width / 60));

  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.font = `${fontSize}px monospace`;
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
  const crossSize = Math.max(8, Math.min(12, width / 40));
  ctx.beginPath();
  ctx.moveTo(centerX - crossSize, centerY);
  ctx.lineTo(centerX + crossSize, centerY);
  ctx.moveTo(centerX, centerY - crossSize);
  ctx.lineTo(centerX, centerY + crossSize);
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
