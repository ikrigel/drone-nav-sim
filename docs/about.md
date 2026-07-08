# About Drone Navigation Simulator

## What Is This App?

**Drone Navigation Simulator v2.7.0** — Turn your phone into a drone and navigate with camera-based position tracking.

This is **NOT a flight game or simulation**. Your phone IS the drone. Real camera analysis calculates your movement in real-time.

## How It Works

### 📷 Camera-Based Movement

When you start a flight:
1. App accesses your device camera
2. Detects features (corners, edges) in each frame
3. Tracks how features move between frames (optical flow)
4. Converts pixel movement → real-world speed using camera calibration
5. Calculates your position and heading in real-time

**Result:** Position tracking without GPS, anywhere indoors or outdoors

### 📊 Real-Time Telemetry (HUD Display)

You see live data while navigating:
- **HDG** — Heading compass direction (0-360°, N/E/S/W)
- **SPD** — Speed in m/s from optical flow analysis
- **ALT** — Altitude relative to start point (-1.5m to +1.5m)
  - Positive: climbing stairs or raising phone
  - Negative: going downhill or lowering phone
- **X, Y** — Horizontal coordinates from start point (meters)
- **FEAT** — Number of tracked features (10-100+)
  - More features = better tracking
  - 100+ is excellent
- **VX, VY** — Velocity components (direction + speed)
- **DIST** — Total distance traveled
- **TIME** — Elapsed flight time

### 🗺️ Flight Plotter

Top-down map shows:
- Your current position (blue dot)
- Your route trail (connected line)
- Range rings (50m, 100m circles)
- Heading arrow pointing your direction

### 📱 What Sensors Are Used?

✅ **Camera** — Optical flow (movement detection)  
✅ **Compass** — Heading direction  
✅ **Accelerometer** — Speed estimation (future: IMU fusion)  
❌ **GPS** — Not used (this is the whole point!)  
❌ **Wi-Fi/Bluetooth** — Not used  

## Features

### Core Capabilities

✅ **Multi-Route Building** — Click points to create custom paths (up to 14+ waypoints)  
✅ **Route Save/Load** — Store routes in localStorage, export as JSON  
✅ **GPS Live Tracking** — Real-time position updates (optional)  
✅ **Auto-Reroute Detection** — Detects when you deviate from planned path  
✅ **Dark/Light/Satellite Maps** — Three map styles  
✅ **Metric/Imperial Units** — Switch between m/s & mph, meters & feet  
✅ **Live Camera Feed** — See camera stream during flight (toggle in Settings)  
✅ **Route Compression** — 5-50x smaller files via intelligent waypoint selection  
✅ **Hebrew + English** — Full bilingual interface with RTL support  

### Advanced Features

✅ **Kalman Filtering** — Smooths position estimates to reduce noise  
✅ **Coreset Compression** — Uses geometry + camera quality to reduce route data  
✅ **Camera Calibration** — Auto-estimates focal length on first flight  
✅ **Relative Altitude Tracking** — Altitude relative to starting point, not absolute  
✅ **QR Code Transfer** — Share routes via QR code peer-to-peer  
✅ **Debug Logging** — Console logging for troubleshooting  

## Data & Privacy

### What Data Is Stored?

All data stays on your device:
- ✅ Saved routes (localStorage)
- ✅ Custom waypoints (localStorage)
- ✅ Flight history (localStorage)
- ✅ Settings (localStorage)
- ✅ Camera calibration (localStorage)

### What Is Sent Elsewhere?

❌ **Nothing.** This app has **zero backend**. No internet required.

- Routes are JSON you export manually
- QR codes transfer data peer-to-peer (no cloud)
- Hosted on Vercel as static files (no tracking)

### Privacy Features

- ✅ All processing happens locally (no cloud API calls)
- ✅ Camera feed never leaves your device
- ✅ Optional camera display (toggle off if you prefer)
- ✅ No analytics or telemetry
- ✅ No cookies or user tracking

## Technical Details

### Camera Calibration

On first flight, the app:
1. Estimates camera intrinsics (focal length, principal point)
2. Assumes ~60° horizontal field of view (typical phone camera)
3. Calculates focal length in pixels
4. Saves to localStorage for future flights
5. Improves accuracy with each flight

**Calibration Formula:**
```
focal_length = (camera_width / 2) / tan(FOV / 2)
```

### Optical Flow Algorithm

The app detects movement using:
1. **Sobel Edge Detection** — Find corners and edges
2. **Feature Matching** — Track features frame-to-frame
3. **Optical Flow** — Calculate pixel-per-frame movement
4. **Speed Conversion** — Map pixel movement to real m/s
5. **Kalman Smoothing** — Remove noise from estimates

**Speed Formula:**
```
speed = (pixel_flow × altitude) / focal_length
```

### Position Tracking

Position is integrated over time:
1. Start at (0, 0) when flight begins
2. Each frame: new_position = old_position + velocity × time_delta
3. Kalman filter smooths position to reduce noise
4. Heading converts velocity to X/Y components

## Limitations

### What This App Can't Do

❌ **No GPS** — Can't track without visible camera features  
❌ **No outdoor open fields** — Needs textured scene (walls, terrain features)  
❌ **No fast spinning** — Camera needs time to settle  
❌ **No blank walls** — Uniform surfaces have no trackable features  
❌ **No loop closure** — Can't recognize when you return to start  
❌ **No IMU fusion** — Doesn't use gyroscope for robustness (future feature)  

### When It Works Best

✅ **Indoor spaces** — Rooms, hallways, stairs, buildings  
✅ **Textured scenes** — Walls, doors, windows, furniture  
✅ **Slower movement** — Walking speed works better than running  
✅ **Good lighting** — Needs to see features clearly  
✅ **Consistent scene** — Changes in lighting confuse feature detection  

## Current Version

**v2.7.0** — Enhanced Documentation Release

### Recent Updates

- v2.7.0 — Comprehensive documentation
- v2.6.0 — Relative altitude tracking (±1.5m range)
- v2.5.0 — Coreset route compression (80-92% size reduction)
- v2.4.0 — Live camera feed display
- v2.3.0 — Unit conversion, responsive design fixes

### Known Issues & Future

**Coming Soon:**
- [ ] Loop closure detection (recognize returning to start)
- [ ] IMU sensor fusion (accelerometer + camera)
- [ ] Room boundary constraints (keep drone in valid area)
- [ ] Real-time route compression during flight
- [ ] Particle filter for better position estimates

## Use Cases

### 🚁 Indoor Navigation Testing
Test navigation algorithms indoors without GPS

### 📊 Movement Analysis
Analyze walking patterns, climbing speed, directional changes

### 🎮 Alternative Navigation
Play with camera-based movement as an alternative to GPS

### 🧪 Computer Vision Experimentation
Learn about optical flow, feature detection, camera calibration

### 📈 Accessibility
Navigation assistance for GPS-denied environments

## Questions?

- **Settings (⚙️)** — Adjust units, font size, camera view
- **About (ℹ️)** — Version info and project description
- **Help (❓)** — Detailed feature guide and troubleshooting
- **Browser Console (F12)** — Enable debug logs for diagnostics

---

**Learn more:** See [help.md](help.md) for detailed user guide  
**For developers:** See [CLAUDE.md](../CLAUDE.md) for technical architecture  
**Report bugs:** Check [ROUTE_STABILITY_INVESTIGATION.md](../ROUTE_STABILITY_INVESTIGATION.md)
