# Drone Navigation Simulator

A GPS-free drone flight simulator that uses device orientation sensors (compass, pitch, roll) to estimate movement and self-location via dead reckoning.

## Features

- **Tilt-as-joystick control**: Pitch forward to accelerate, roll to climb/descend
- **Real-time heading tracking**: Uses device compass to set direction of travel
- **Dead-reckoning navigation**: Integrates heading + speed over time to estimate position
- **Live flight visualization**: Top-down radar plotter with HUD telemetry
- **Local coordinate system**: All positions relative to start point (no GPS needed)
- **Flight history**: Sessions saved to localStorage with full track data

## Quick Start

```bash
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5173 on a phone or device with orientation sensors.

## Deployment

```bash
npm run build
vercel deploy --prod
```

The app uses the known-good Vercel recipe from devkit-console:
- Flat repo root (no monorepo nesting)
- Plain npm with package-lock.json
- No framework auto-detection (vercel.json specifies commands explicitly)

## Project Structure

```
src/
  components/        # React UI components
  hooks/            # React hooks for sensors and simulation
  utils/            # Pure math utilities (dead reckoning, storage)
  types.ts          # TypeScript type definitions
  App.tsx           # Main app component
  main.tsx          # Entry point
```

## Technical Details

### Dead Reckoning Math

Position integration at each frame:
```
dx = speed * sin(heading) * dt
dy = speed * cos(heading) * dt
dz = climb_rate * dt
```

Speed derived from pitch angle (not raw acceleration):
```
speed = (pitch - neutral_pitch) * sensitivity
```

Climb rate derived from roll angle:
```
climb = -(roll - neutral_roll) * sensitivity
```

### Sensor Access

- iOS 13+: Requires explicit permission via DeviceOrientationEvent.requestPermission()
- Android: Uses deviceorientationabsolute event
- Fallback: Raw deviceorientation event (heading may be relative, not true-north)

### Storage

- Flight sessions persisted to localStorage under `drone-nav:flight-sessions:v1`
- Settings persisted under `drone-nav:settings:v1`
- All storage wrapped in try/catch for privacy-mode browsers
