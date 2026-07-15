# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install
npm run dev          # http://localhost:5173 (hot reload enabled)
npm run build        # Production bundle to ./dist
npm run typecheck    # Type check with strict mode
npm test             # Run 25 Playwright E2E tests
npm run preview      # Preview production build locally
```

## Project Overview

**Drone Navigation Simulator v2.9.0** — GPS-free navigation tracking using phone camera optical flow and device orientation sensors. Users move their phone to simulate drone movement; the app calculates position, altitude, and full 6DOF orientation from camera features and device sensors. Supports three coordinate collection modes: 3DOF position-only, 4DOF position+heading, or full 6DOF position+rotation. Includes dynamic map zoom controls with centimeter-level accuracy (100px/meter baseline) and comprehensive academic proof verification.

**Key Distinction:** This is NOT a flight simulator. The phone IS the drone. Real camera analysis drives position calculation.

- **Language:** TypeScript (strict mode)
- **Framework:** React 18 + Vite
- **Testing:** Playwright (25 E2E tests)
- **Build:** Vite SPA → static export to Vercel
- **No Backend:** All data in localStorage + QR peer-to-peer transfer
- **Storage:** localStorage with versioned keys (v1 schema)

## Architecture Overview

### Core State Management

All state via React hooks orchestrated by `useAppWiring.ts` pattern:

1. **Main Hook Ecosystem (20+ hooks):**
   - `useAppSettings` — font size, units (metric/imperial), debug logging, camera view toggle
   - `useCameraMovement` — optical flow detection, position calculation, Kalman filtering
   - `useAppUtilities`, `useRouteManagement` — navigation and storage helpers

2. **Key Flow:**
   - Camera feed → `useCameraMovement` hook
   - Extract features (Sobel edge detection)
   - Match features frame-to-frame (optical flow)
   - Convert pixel flow → m/s speed via camera calibration
   - Integrate position with Kalman smoothing
   - Render on FlightPlotter (top-down view)

### Navigation Model

**Ground-Level Exploration (Not Flight Simulation):**
- Z-axis (altitude) relative to starting point: -1.5m to +1.5m range
- Can go negative (lowering phone / downhill) or positive (climbing stairs / mountains)
- Starts at 0.0m when "Start Flight" clicked
- Feature positions in camera frame determine altitude change

**Position Calculation:**
```
speed_mps = (optical_flow_pixels × altitude) / focal_length
position_x = position_x + vx × dt
position_y = position_y + vy × dt
heading = optical_flow_angle (0-360°)
```

### Data Compression

**Coreset-Based Route Compression** (v2.5.0+):
- Ramer-Douglas-Peucker (RDP) algorithm removes collinear points
- Quality-based filtering keeps high-confidence tracking points (FEAT > threshold)
- Heading-change detection keeps turning points
- Result: 5-50x compression while preserving route shape
- Export includes both full route + compressed waypoints

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main render function (~220 lines), wires all hooks |
| `src/hooks/useCameraMovement.ts` | Camera capture, optical flow, position integration |
| `src/utils/opticalFlow.ts` | Sobel edge detection, feature matching, altitude estimation |
| `src/utils/kalmanFilter.ts` | 1D/2D Kalman filter for position smoothing |
| `src/utils/routeCoreset.ts` | Coreset compression algorithm; see [Compression Proof](docs/coreset-compression-proof.md) for mathematical guarantee |
| `src/utils/cameraCalibration.ts` | Focal length estimation from device camera |
| `src/utils/flightExport.ts` | JSON export/import with compression metadata |
| `src/components/FlightPlotter.tsx` | Top-down 2D map with range rings |
| `src/components/HUDOverlay.tsx` | Real-time telemetry: HDG, SPD, ALT, X, Y, DIST, FEAT, VZ |
| `src/components/CameraFeed.tsx` | Live camera stream (optional overlay) |
| `src/components/ControlsPanel.tsx` | Flight controls + Export/Import buttons |
| `src/components/MenuBar.tsx` | Settings, About, Help modals |

## Common Tasks

### Adding a Feature

1. **New state?** Create hook in `src/hooks/useMyFeature.ts` (≤250 lines)
2. **Wire in App.tsx** — use hook, pass data to components
3. **UI?** Add component in `src/components/` or update existing
4. **Storage?** Add localStorage key constant + useEffect sync

### Debugging

**Enable debug logs:**
- Settings (⚙️) → toggle "Enable Debug Logs"
- Browser console (F12) → `debug.status()` for current level
- Real-time trace: `debug.trace()` for everything

**Key log messages:**
- `[GPS UPDATE]` — Position calculation loop
- `[FEAT]` — Feature detection count
- `Movement: pos=(x,y,z) vel=(vx,vy)` — Real-time movement

### Testing

```bash
npm test                    # Run all 25 tests
npm run test:ui             # Interactive Playwright UI
npm run test:debug          # Debug mode with inspector
```

**Test files:**
- `tests/app.spec.ts` — 17 core feature tests
- `tests/simulated-routes.spec.ts` — 8 simulated flight tests

**What's tested:**
- App loads, HUD displays
- Controls work (Enable → Start → Stop → Reset)
- Settings modals (font, units, debug, camera toggle)
- Export/Import flight courses
- Responsive design on small screens

## Version History

| Version | Major Changes |
|---------|--------------|
| v2.0.0 | Initial release: optical flow + dead reckoning |
| v2.3.0 | Unit conversion, camera feed toggle, button overlap fixes |
| v2.4.0 | Live camera display, HUD unit conversion |
| v2.5.0 | Coreset route compression (5-50x smaller files) |
| v2.6.0 | Relative altitude (±1.5m range), Kalman filtering |
| v2.7.0 | 6 decimal precision, ResizeObserver for map, camera fullscreen toggle, coreset algorithm fix with mathematical proof |
| v2.8.0 | Full 6DOF support (pitch, roll, yaw from device sensors), 3-tier coordinate collection modes (3DOF/4DOF/6DOF) |
| v2.9.0 | Dynamic map zoom controls (100px/meter baseline for centimeter accuracy), academic proof citations, verified compression algorithm |

## Known Limitations & Next Steps

**Current Limitations:**
- ❌ No loop closure detection (can't recognize returning to start)
- ❌ No room boundary constraints (position can drift outside walls)
- ❌ Single-camera monocular vision (no stereo depth)
- ⚠️ Altitude (z-axis) not optimized in compression (2D-only guarantee in coreset)

**Planned (v2.9.0+):**
- [ ] Loop closure detection
- [ ] User-drawn room boundaries
- [ ] 3D-aware compression (z-axis importance)
- [ ] Real-time compression during flight
- [ ] Particle filter for position refinement
- [ ] Accelerometer integration for climb rate

## Code Style

- **TypeScript:** Strict mode enabled (`noImplicitAny: true`)
- **Naming:** camelCase functions, UPPER_SNAKE_CASE constants
- **Components:** Functional + hooks, ≤250 lines
- **Imports:** Absolute paths from `src/`
- **Comments:** Only "why" not "what" — code explains itself
- **Storage:** Always use `safeStorageGet/Set` wrappers for error handling

## Testing Strategy

1. **Unit tests:** Optical flow math, Kalman filter, compression
2. **Integration tests:** Camera capture, localStorage round-trip
3. **E2E tests:** Full user flows (Playwright, 25 tests)
4. **Manual QA:** Camera on real device, stairs/climbing, export/import

## Deployment

**Build:** `npm run build` → `dist/` folder (static export)  
**Deploy:** Push to main branch → GitHub Actions → Vercel auto-deploy  
**Live:** https://drone-nav-sim.vercel.app

## Resources

- **About:** See [docs/about.md](docs/about.md) — user-facing explanation
- **Help:** See [docs/help.md](docs/help.md) — user guide with tips
- **Troubleshooting:** See [ROUTE_STABILITY_INVESTIGATION.md](ROUTE_STABILITY_INVESTIGATION.md)
- **Changelog:** See [CHANGELOG.md](CHANGELOG.md) — version history with features

---

## Project Attribution

**Project Author:** Igal Krigel  
**Academic Supervisor:** Professor Dan Feldman  
**Coreset Theory Base:** Feldman & Langberg (2011) - "A unified framework for approximating and clustering data"

**Mathematical Documentation:** See [docs/coreset-compression-proof.md](docs/coreset-compression-proof.md) for rigorous proofs

**Last Updated:** v2.9.0  
**For questions:** Check CLAUDE.md first, then explore `docs/` directory
