# Route Stability Investigation Guide

## Issue Description
Route display shows a straight line instead of actual path when walking from corner to corner (e.g., in a square room). Expected: path shows all 4 corners. Actual: shows single straight line.

## Root Cause Analysis

### Possible Causes
1. **Heading Not Changing** - Compass bearing stays same for entire flight
   - Check: Enable debug logs and watch HDG value change as you rotate phone
   - Fix: Verify compass sensor is working, check heading calculation in useCameraMovement

2. **Optical Flow Calculation Issue** - Movement not being detected from camera
   - Check: Watch SPD value in HUD - should change when moving
   - Fix: Verify detectFeatures() finds enough features (FEAT > 10)
   - Verify feature matching finds correspondences between frames

3. **Position Not Accumulating** - X/Y coordinates stay at 0
   - Check: Look at X/Y values in bottom left HUD
   - Fix: Verify coordinate update logic in useCameraMovement lines 204-213

4. **Data Noise/Filtering** - Raw data is too noisy
   - Check: Enable debug logs, check Movement log entries
   - Fix: Add median filter or Kalman filter to smooth position/heading changes

## Debug Checklist

### Step 1: Verify Compass Heading
```
1. Open app with debug logs enabled
2. Start flight
3. Slowly rotate phone 360°
4. Watch HDG value in top-left - should go from 0→360
5. Check browser console for "Movement: heading=" logs
```

**Expected:** HDG changes 0→360 as phone rotates  
**If not:** Compass sensor not working or heading calculation broken

### Step 2: Verify Optical Flow Detection
```
1. Start flight
2. Move phone forward slowly
3. Watch SPD value - should increase above 0.00
4. Watch FEAT value - should be 10+ 
5. Check FLOW value - should change when moving
```

**Expected:** SPD > 0 m/s, FEAT > 10, FLOW > 5 px  
**If not:** Camera feature detection or flow calculation broken

### Step 3: Verify Position Accumulation
```
1. Start flight
2. Move forward 5 steps slowly
3. Watch X/Y coordinates  
4. Check console logs for "Movement: pos=" entries
```

**Expected:** X or Y increases progressively  
**If not:** Position update logic broken (lines 204-213)

### Step 4: Check for Noise Issues
```
1. Enable debug level "trace"
2. Move very slowly (0.1 m/s)
3. Check if position jumps around or stays steady
```

**Expected:** Position smoothly increases  
**If noisy:** Add filtering to optical flow or heading

## Files to Investigate

### Primary Files
- `src/hooks/useCameraMovement.ts` (lines 190-213)
  - Position update calculation
  - Heading/velocity math

- `src/utils/opticalFlow.ts`
  - detectFeatures() - feature detection quality
  - matchFeatures() - feature correspondence
  - calculateOpticalFlow() - flow magnitude calculation
  - opticalFlowToSpeed() - pixel flow → m/s conversion

- `src/utils/cameraCalibration.ts`
  - Focal length calibration
  - Distance calculation accuracy

### Secondary Files
- `src/components/FlightPlotter.tsx`
  - Path rendering logic
  - Scale/zoom calculation

## Solution Options

### Quick Fix (Highest Priority)
1. **Add Heading Smoothing**
   ```typescript
   // Smooth heading changes to avoid noise
   const headingDelta = ((flowHeading - headingRef.current + 180) % 360) - 180;
   const smoothHeading = headingRef.current + headingDelta * 0.3; // 30% weight to new value
   ```

2. **Add Position Lowpass Filter**
   ```typescript
   // Smooth X/Y position with alpha=0.2
   const alpha = 0.2;
   x = x * alpha + prevX * (1 - alpha);
   y = y * alpha + prevY * (1 - alpha);
   ```

3. **Verify Feature Matching Quality**
   - Increase feature detection threshold if too many false matches
   - Verify descriptor matching (currently using simple distance threshold)

### Medium-Term Fixes
1. Implement Kalman filter for position/heading estimation
2. Add outlier rejection for optical flow
3. Implement adaptive sensitivity based on lighting conditions
4. Add gyroscope rotation rate integration as backup

### Long-Term Improvements
1. Camera intrinsic calibration on app startup
2. Multi-feature consensus voting for accuracy
3. IMU sensor fusion (accelerometer + gyroscope)
4. Comparison with actual distance traveled (user input)

## Testing Route

### Test Case: Square Room Walk
1. Start app
2. Enable sensors + start flight
3. Walk 5 meters north → stop 1 second
4. Walk 5 meters east → stop 1 second
5. Walk 5 meters south → stop 1 second
6. Walk 5 meters west → stop 1 second
7. Stop flight

**Expected Path:** Square with ~5m sides  
**Current Bug:** Straight line 

## Key Metrics to Monitor

| Metric | Healthy | Broken |
|--------|---------|--------|
| HDG (heading) | 0→360° as rotate | Stays same |
| SPD (speed) | 0→2 m/s when moving | Stays 0.00 m/s |
| ALT (altitude) | 0→0.5m when tilted | Stays 0.0 m |
| X, Y (position) | Increase progressively | Stay 0.0 |
| FEAT (features) | 15-50 | < 10 |
| FLOW (flow magnitude) | 5-50 px when moving | 0-2 px |

## Console Commands

```javascript
// Enable trace logging
debug.debug();

// Check last 20 movements
debug.history().filter(e => e.message.includes('Movement')).slice(-20)

// Show raw optical flow values
debug.history().filter(e => e.message.includes('FLOW')).slice(-10)
```

## Next Steps

1. **Enable debug logging** on mobile phone
2. **Run through Debug Checklist** above
3. **Note which step fails first**
4. **Apply Quick Fix** for that subsystem
5. **Retest** with debug logs
6. **Commit findings** to GitHub

## Related Code Sections

**Position update (line 204):**
```typescript
coordsRef.current = {
  ...coordsRef.current,
  x: coordsRef.current.x + vx * dtSeconds,  // ← Check this
  y: coordsRef.current.y + vy * dtSeconds,  // ← Check this
  z: Math.max(0, altitude),
  heading: flowHeading,
  vx, vy, vz: 0,
};
```

**Velocity calculation (lines 199-201):**
```typescript
const flowHeading = (flow.angle * 180 / Math.PI + 360) % 360;
const vx = Math.sin((flowHeading * Math.PI) / 180) * speed;  // ← Check angle math
const vy = Math.cos((flowHeading * Math.PI) / 180) * speed;  // ← Check angle math
```

## Questions to Answer

1. When you rotate the phone, does HDG value change? ✓/✗
2. When you move the phone forward, does SPD increase? ✓/✗
3. Do FEAT values stay > 10 during movement? ✓/✗
4. Do X/Y coordinates change from 0.0? ✓/✗
5. Does the flightplotter show a marker moving? ✓/✗

**If all yes:** Issue is in position accumulation math  
**If any no:** Check that subsystem first

---

**Last Updated:** v2.3.0  
**Status:** Under Investigation  
**Priority:** CRITICAL - Blocks release of v2.4.0
