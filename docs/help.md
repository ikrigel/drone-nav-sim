# User Guide: Drone Navigation Simulator

## Getting Started

### 1️⃣ First Time Setup

1. **Open the app** → https://drone-nav-sim.vercel.app
2. **Grant permissions** when prompted
   - Camera access required (optical flow detection)
   - Compass access required (heading tracking)
3. **Click "Enable Sensors"** button
4. **Wait for camera initialization** (2-3 seconds)
5. **Click "Start Flight"** when ready

### 2️⃣ During Flight

1. **Move your phone smoothly** in any direction
2. **Watch HUD display** update in real-time:
   - HDG shows your heading direction
   - SPD shows your movement speed
   - ALT shows altitude change from start point
   - X, Y show your horizontal position
3. **Watch FlightPlotter** (map) show your trail
4. **Click "Stop Flight"** when done

### 3️⃣ After Flight

1. **View flight statistics** in HUD
2. **Click "💾 Export"** to save route as JSON
   - File includes compression statistics
   - Shows 5-50x size reduction
3. **Click "📥 Import"** to load a previous flight
4. **Click "Reset"** to clear and start new flight

---

## Features Explained

### 🗺️ FlightPlotter (Top-Down Map)

Shows your movement from above:

```
        N (North)
        ↑
    [50m ring]
W ← [100m ring] → E
        ↓
        S
```

**Elements:**
- **Center crosshairs** — Your current position
- **Blue dot** — Starting point (0, 0)
- **Connected line** — Your route trail
- **Range rings** — 50m and 100m from start
- **Arrow** — Your heading direction
- **Coordinate grid** — X/Y position labels

**How to read:**
- Top of map = North
- Right = East
- Bottom = South
- Left = West
- Distance from center = how far from start point

**Map Zoom Controls** (NEW in v2.8.0)
- **+/- Buttons** — Located in bottom-right corner of map
  - Press **+** to zoom in (get closer view, down to 1cm per pixel at 5× zoom)
  - Press **−** to zoom out (get wider view, up to 3m per pixel at 0.33× zoom)
  - **% Display** — Shows current zoom level (100% = baseline 100px/meter for centimeter accuracy)
- **Default Scale** — 100 pixels per meter (1 cm = 1 pixel) for high-fidelity navigation
- **Adaptive Rings** — Range rings automatically adjust spacing based on zoom level
  - High zoom: 0.5m rings for fine detail
  - Low zoom: 50m rings for overview

### 📊 HUD Telemetry (Real-Time Data)

**Top Row (Position & Direction):**
- **HDG** — Heading (0-360°)
  - 0° = North (↑)
  - 90° = East (→)
  - 180° = South (↓)
  - 270° = West (←)
- **SPD** — Speed in meters per second
  - Walking ~1.4 m/s
  - Running ~3-5 m/s
- **ALT** — Altitude (height) in meters
  - 0 = starting point
  - +0.5 = climbing stairs
  - -0.3 = lowering phone/downhill
  - Range: -1.5m to +1.5m
- **X, Y** — Horizontal position (meters from start)
  - (0, 0) = where you started
  - X positive = east
  - Y positive = north

**Bottom Row (Movement Details):**
- **TIME** — Elapsed flight time (HH:MM:SS)
- **DIST** — Total distance traveled (meters)
- **FLOW** — Optical flow magnitude (pixels)
  - Shows how much features moved
  - Higher = faster movement
- **VX, VY** — Velocity components (m/s)
  - Direction of movement broken into X and Y
- **FEAT** — Feature count (tracked points)
  - 10-50 = good
  - 100+ = excellent
  - <10 = bad (try better lighting)

### ⚙️ Settings

Access via **⚙️ button** (top-right):

**Font Size**
- Small, Medium, Large, XL, XXL
- For different screen sizes and readability

**Units**
- **Metric** (default) — meters, m/s
- **Imperial** — feet, mph

**Camera View**
- Toggle to see live camera feed (bottom-right corner)
- Useful for debugging feature detection
- **Size Mode**: Choose between Small (PIP) or Fullscreen camera view
- Use the ⤢/⤡ button in the camera feed to toggle between modes

**Coordinate Set** (NEW in v2.8.0)
- Choose which axes to collect during flight:
  - **3DOF** — Position only (x, y, z) — minimal sensor use
  - **4DOF** — Position + heading (x, y, z, heading) — default, balanced
  - **6DOF** — Full orientation (x, y, z, pitch, roll, yaw) — requires device orientation permission
- Selection affects what data is exported and displayed on HUD
- Can be changed anytime in Settings; change takes effect on next flight

**Debug Logging**
- Enable to see detailed logs in browser console (F12)
- Levels: Trace, Debug, Info, Warn, Error
- Type `debug.status()` in console to see current level

### 📤 Export/Import Routes

**Export (💾 button):**
1. After flight stops
2. Click "💾 Export"
3. File downloads as `flight-{timestamp}.json`
4. File includes:
   - Full route (all waypoints)
   - Compressed waypoints (5-50x smaller)
   - Compression statistics
   - Metadata (distance, duration, altitude)

**Import (📥 button):**
1. Click "📥 Import"
2. Select a `.json` file from your device
3. Route loads and shows statistics
4. Can re-export with different compression settings

**File Size Reduction Example:**
```
Original: 5000 points → 600 KB
Compressed: 400 waypoints → 48 KB (92% smaller!)
```

---

## Tips for Best Results

### 🎯 Before You Start

**Good Lighting**
- Need to see scene features clearly
- Avoid backlit situations (sun behind you)
- Adjust device screen brightness if needed

**Textured Scene**
- Indoor spaces work best (walls, doors, windows)
- Need visual features to track (not blank walls)
- Corners and edges are tracked best

**Stable Holding**
- Don't shake the camera
- Use smooth, controlled movements
- Can hold still to see a pause in altitude

**Clear Path**
- Remove obstacles from your movement path
- Don't point camera straight up/down initially
- Need mix of scene features

### ⏱️ During Flight

**Start Slowly**
- First few seconds: camera calibrates and adjusts
- Walk slowly for first 10m
- Speed up after features are tracked

**Smooth Movements**
- Avoid jerky motions
- Constant direction = better tracking
- Turns work better than zigzags

**Keep Features in View**
- Don't point camera at blank walls
- Don't look straight at bright lights
- Keep scene in view (don't spin too fast)

**Watch the FEAT Count**
- If FEAT < 10: reposition to see more features
- If FEAT 50+: excellent tracking
- FEAT = 100 means perfect conditions

**Use Elevation Changes**
- Climb stairs to see positive ALT
- Walk uphill for altitude increase
- Lower your phone to see negative ALT

### 🔍 Troubleshooting

**"Map Not Drawing" or "No Calculations"**
- Check browser console (F12) for errors
- Enable debug logs (⚙️ → Debug Logging)
- Grant camera permission when prompted
- Try different lighting conditions

**FEAT Count Always Low (<10)**
- Need better lighting or textured scene
- Try indoors instead of outside
- Point camera at walls with details
- Adjust phone distance to scene

**Position Drifts Away**
- This is expected (camera-based tracking drifts over time)
- Shorter flights are more accurate
- Use Kalman filtering (already enabled)
- Avoid long straight paths without landmarks

**Camera Permission Denied**
- Check browser privacy settings
- Allow camera access in system settings
- Try different browser (Chrome, Firefox, Safari)
- Clear cache and reload

**Export File Too Large**
- Coreset compression should be automatic
- File is saved JSON (text, not binary)
- Import/Export still works at any size

**Altitude Stuck at 0**
- Point camera at angled surfaces (not flat)
- Tilt phone to show scene features
- Need vertical variation in scene

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| F12 | Open browser developer console (debug logs) |
| Ctrl+R | Reload app (clears session, keeps saved routes) |
| Ctrl+Shift+Delete | Clear browser cache (resets everything) |

## Browser Requirements

✅ **Chrome/Edge** (best compatibility)  
✅ **Firefox** (works well)  
✅ **Safari** (iOS 11+)  
⚠️ **Mobile Safari** (works but may have camera access issues)

**Required Features:**
- Camera access (getUserMedia API)
- localStorage (route persistence)
- Geolocation (optional, not used for calculations)

## Common Scenarios

### Scenario 1: Walk Through Your House

1. Start at front door (click Start Flight)
2. Walk through living room, kitchen, hallway
3. Climb stairs to second floor
4. Walk around bedroom
5. Stop flight (click Stop Flight)
6. Export route as JSON
7. Share with others via QR code

**Expected:**
- X/Y shows path through rooms
- ALT goes +0.5 to +1.0 when climbing stairs
- Total distance shows feet walked
- Route file ~50KB compressed

### Scenario 2: Check Feature Detection

1. Enable Camera View (⚙️ Settings → Show Live Camera Feed)
2. Start flight in different locations
3. Watch FEAT count in HUD:
   - High FEAT (50+) = good location
   - Low FEAT (<10) = poor conditions
   - No FEAT = no camera access
4. Stop flight
5. Try adjusting lighting or scene

### Scenario 3: Debug Altitude Issues

1. Enable Debug Logging (⚙️ → Debug Logging → Debug level)
2. Open console (F12)
3. Start flight
4. Tilt phone up/down and watch ALT change
5. Look at console for "Movement: ... alt=" messages
6. Check if ALT changes make sense

### Scenario 4: Export & Compare Routes

1. Fly route A → Export as `route-a.json`
2. Fly route B → Export as `route-b.json`
3. Compare file sizes (see compression ratio)
4. Import route A later to verify data integrity

---

## FAQs

**Q: Is this a flight simulator game?**  
A: No. Your phone IS the drone. Real camera analysis calculates movement.

**Q: Do I need GPS?**  
A: No! This uses camera optical flow instead (that's why it works indoors).

**Q: Where is my data stored?**  
A: All on your device (localStorage). Nothing sent to cloud.

**Q: Can I share routes?**  
A: Yes! Export as JSON or use QR code for peer-to-peer transfer.

**Q: Why does position drift over time?**  
A: Camera-based tracking accumulates small errors. Shorter flights are more accurate.

**Q: Can I use this outdoors?**  
A: Yes! Needs textured scene (not blank sky or snow).

**Q: What's the ALT range?**  
A: -1.5m to +1.5m from starting point (good for indoor climbing/descending).

**Q: Why is FEAT count important?**  
A: More features = better tracking. <10 means poor conditions.

---

## Next Steps

- **Explore Settings** — Adjust units and font size
- **Try Different Locations** — See what scenes work best
- **Export a Route** — Save your flight as JSON
- **Enable Debug** — See real-time calculations
- **Read About** (ℹ️) — Learn how it technically works

---

**Version:** v2.9.0  
**Need help?** Check browser console (F12) → enable debug logs  
**Report bugs:** https://github.com/ikrigel/drone-nav-sim/issues
