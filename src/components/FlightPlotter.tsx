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

  // Ensure canvas is redrawn when trackPoints changes (including empty)
  useEffect(() => {
    if (trackPoints.length === 0) {
      // Force immediate redraw when track is cleared (new flight)
      drawRef.current();
    }
  }, [trackPoints.length]);

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

      // Clear canvas completely
      ctx.clearRect(0, 0, width, height);
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
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const first = trackPoints[0];
        // Debug: log coordinate spread to diagnose straight-line issue
        const xSpread = Math.max(...trackPoints.map(p => p.x)) - Math.min(...trackPoints.map(p => p.x));
        const ySpread = Math.max(...trackPoints.map(p => p.y)) - Math.min(...trackPoints.map(p => p.y));
        if (trackPoints.length > 5) {
          console.log(`[MAP-DIAG] Points: ${trackPoints.length} | X-range: ${xSpread.toFixed(3)}m | Y-range: ${ySpread.toFixed(3)}m | Current: (${position.x.toFixed(2)}, ${position.y.toFixed(2)})`);
          if (xSpread < 0.05 || ySpread < 0.05) {
            console.warn(`[MAP-WARN] Possible heading lock - only moving on one axis!`);
          }
        }
        ctx.moveTo(centerX + (first.y - position.y) * scale, centerY - (first.x - position.x) * scale);
        for (let i = 1; i < trackPoints.length; i++) {
          const p = trackPoints[i];
          ctx.lineTo(centerX + (p.y - position.y) * scale, centerY - (p.x - position.x) * scale);
        }
        ctx.stroke();

        // Draw waypoints as circles (larger for better visibility)
        ctx.fillStyle = '#00ff00';
        ctx.strokeStyle = '#00dd00';
        ctx.lineWidth = 1;
        for (let i = 0; i < trackPoints.length; i += Math.max(1, Math.floor(trackPoints.length / 20))) {
          const p = trackPoints[i];
          const x = centerX + (p.y - position.y) * scale;
          const y = centerY - (p.x - position.x) * scale;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Draw starting point marker (blue dot with ring)
        if (trackPoints.length > 0) {
          const start = trackPoints[0];
          const startX = centerX + (start.y - position.y) * scale;
          const startY = centerY - (start.x - position.x) * scale;
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(startX, startY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          // Draw outer ring around start point
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(startX, startY, 10, 0, Math.PI * 2);
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

      // Debug: show track point count and coordinate ranges
      if (trackPoints.length > 0) {
        const xMin = Math.min(...trackPoints.map(p => p.x));
        const xMax = Math.max(...trackPoints.map(p => p.x));
        const yMin = Math.min(...trackPoints.map(p => p.y));
        const yMax = Math.max(...trackPoints.map(p => p.y));
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;

        ctx.fillStyle = '#666';
        ctx.font = `10px monospace`;
        ctx.fillText(`Tracks: ${trackPoints.length} | X-range: ${xRange.toFixed(2)}m | Y-range: ${yRange.toFixed(2)}m`, 10, 20);

        // Warn if movement is only on one axis (indicates heading bug)
        if ((xRange < 0.01 && yRange > 0.1) || (yRange < 0.01 && xRange > 0.1)) {
          ctx.fillStyle = '#ff6600';
          ctx.fillText('⚠ WARNING: Movement on only one axis - check heading calculation!', 10, 35);
          console.warn(`[MAP] WARNING: Linear motion detected | X: ${xRange.toFixed(3)}m | Y: ${yRange.toFixed(3)}m`);
        }
      }
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

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.font = `${fontSize}px monospace`;
  ctx.fillStyle = '#888';

  for (let i = 1; i <= ringsToShow; i++) {
    const radius = ringInterval * i * scale;
    if (radius > maxRadius) break;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillText(`${ringInterval * i}m`, centerX + radius + 2, centerY - 2);
  }

  // Cardinal direction indicators (N, E, S, W)
  const cardinalDistance = Math.min(maxRadius * 0.85, Math.max(50, width / 8));
  ctx.fillStyle = '#666';
  ctx.font = `bold ${fontSize + 2}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', centerX, centerY - cardinalDistance);
  ctx.fillText('S', centerX, centerY + cardinalDistance);
  ctx.textAlign = 'right';
  ctx.fillText('W', centerX - cardinalDistance, centerY);
  ctx.textAlign = 'left';
  ctx.fillText('E', centerX + cardinalDistance, centerY);

  // Center crosshair - brighter for visibility
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;
  const crossSize = Math.max(10, Math.min(15, width / 40));
  ctx.beginPath();
  ctx.moveTo(centerX - crossSize, centerY);
  ctx.lineTo(centerX + crossSize, centerY);
  ctx.moveTo(centerX, centerY - crossSize);
  ctx.lineTo(centerX, centerY + crossSize);
  ctx.stroke();
}

function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, heading: number | null) {
  const size = 16;

  if (heading !== null) {
    // Rotate arrow based on heading (device orientation)
    const headingRad = (heading * Math.PI) / 180;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(headingRad);

    // Arrow body (pointing up) - larger and more visible
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size / 2, size / 2);
    ctx.lineTo(0, size / 3);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fill();

    // Arrow outline - thicker for visibility
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner circle for reference
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  } else {
    // No heading: draw a circle with crosshair
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crosshair for reference
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 6, y);
    ctx.lineTo(x + 6, y);
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x, y + 6);
    ctx.stroke();
  }
}
