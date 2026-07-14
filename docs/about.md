# About Drone Navigation Simulator

## What Is This App?

**Drone Navigation Simulator v2.9.0** — Turn your phone into a drone and navigate with camera-based position tracking and device orientation sensing.

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

✅ **Camera** — Optical flow (movement detection) + feature tracking  
✅ **Device Orientation** — Pitch, roll, compass heading (gyroscope + magnetometer)  
✅ **Optional Accelerometer** — Speed estimation (future: full IMU fusion)  
❌ **GPS** — Not used (this is the whole point!)  
❌ **Wi-Fi/Bluetooth** — Not used  

## Features

### Core Capabilities

✅ **3-Tier Coordinate Collection** — Choose collection mode in Settings:
   - **3DOF** — Position only (x, y, z)
   - **4DOF** — Position + heading (x, y, z, heading) — default
   - **6DOF** — Full orientation (x, y, z, pitch, roll, yaw)  
✅ **Route Save/Load** — Store routes in localStorage, export as JSON  
✅ **Real-Time Position Tracking** — 6 decimal precision, Kalman-filtered updates  
✅ **Metric/Imperial Units** — Switch between m/s & mph, meters & feet  
✅ **Live Camera Feed** — Toggle between small (PIP) and fullscreen modes  
✅ **Route Compression** — 5-50x smaller files via coreset algorithm with mathematical proof  
✅ **Dark Mode** — Easy on the eyes during flight  

### Advanced Features

✅ **Device Orientation Sensors** — Pitch, roll, yaw from device gyroscope and compass  
✅ **Kalman Filtering** — Smooths position estimates to reduce noise  
✅ **Coreset Compression** — RDP algorithm with proven 0.1m error bound; 5-50x file reduction  
✅ **Camera Calibration** — Auto-estimates focal length and principal point on first flight  
✅ **Relative Altitude Tracking** — ±1.5m altitude relative to starting point  
✅ **ResizeObserver** — Canvas redraws correctly when device rotates or window resizes  
✅ **Debug Logging** — Console logging with five verbosity levels for troubleshooting  

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

**v2.9.0** — Map Zoom & Proof Verification Release

### Recent Updates

- v2.9.0 — Dynamic map zoom controls (100px/meter baseline), academic proof citations, verified compression algorithm
- v2.8.0 — Full 6DOF with device sensors, 3-tier coordinate collection modes, 6dp precision, coreset proof
- v2.7.0 — 6-decimal precision, ResizeObserver for map fixes, camera fullscreen toggle
- v2.6.0 — Relative altitude tracking (±1.5m range)
- v2.5.0 — Coreset route compression with mathematical proof (5-50x reduction)

### Known Issues & Future

**Current Limitations:**
- ⚠️ Altitude compression uses 2D-only guarantee (z-axis not optimized)
- ❌ No loop closure detection (can't recognize returning to start)
- ❌ No room boundary constraints (can drift outside walls)

**Coming Soon (v3.0.0+):**
- [ ] Loop closure detection
- [ ] 3D-aware compression (z-axis importance)
- [ ] Room boundary constraints
- [ ] Full accelerometer integration for climb rate
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
