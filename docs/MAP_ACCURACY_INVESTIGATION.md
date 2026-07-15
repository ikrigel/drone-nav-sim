# Map Accuracy Investigation & Geometric Shape Testing

**Date:** July 2026  
**Status:** Issue Identified - Root Cause Analysis Required  
**Severity:** Critical (Navigation accuracy completely broken)

---

## User-Reported Issue (v2.8.0)

**Test Scenario:**
- Walked 3m × 3m square path
- Returned to starting point

**Actual Results:**
- Map displayed straight line (not square shape)
- End position ≠ starting position (large closure error)
- Closure error > 3m (completely off for a 3m path)

**Expected Results:**
- Map should show 4 corners forming square
- End position should match start (closure error < 0.1m)
- Shape fidelity preserved

---

## Root Cause Analysis

### Hypothesis 1: Optical Flow Broken ⚠️ HIGH PROBABILITY

**Symptoms:**
- Straight line instead of square = no direction detection
- App only knows distance traveled, not direction

**Where to check:**
```
src/hooks/useCameraMovement.ts (line ~150-200)
- Check feature detection count (FEAT in HUD)
- Verify feature matching between frames
- Check optical flow heading calculation
```

**Test:**
1. Walk north 1m, check HUD: Y should be ~1.0, X should be ~0
2. Walk east 1m, check HUD: X should be ~1.0, Y should be ~1.0
3. If heading is constant (not changing 0° → 90° → 180°), flow is broken

---

### Hypothesis 2: Heading Calculation Wrong ⚠️ MEDIUM PROBABILITY

**Symptoms:**
- Feature flow detected (velocity exists)
- But direction doesn't change with movement
- App thinks always moving in same direction

**Where to check:**
```
src/utils/opticalFlow.ts (line ~250-300)
- Check arctan2() calculation
- Verify optical flow angle computation
- Check heading vs previous heading logic
```

**Test:**
1. Walk in circle (rotate around a point)
2. Check HUD heading: should rotate 0° → 90° → 180° → 270° → 0°
3. If heading stays constant, calculation is broken

---

### Hypothesis 3: Kalman Filter Drift ⚠️ MEDIUM PROBABILITY

**Symptoms:**
- Small initial tracking works
- Large path has large closure error
- Error accumulates with distance

**Where to check:**
```
src/utils/kalmanFilter.ts (line ~1-50)
- Check process noise (Q matrix)
- Check measurement noise (R matrix)
- Verify state update equation
src/hooks/useCameraMovement.ts (line ~250-270)
- Check Kalman filter initialization
- Check noise parameter values
```

**Test:**
1. Walk 1m north → check closure (should be 0.05m)
2. Walk 10m north → check closure (if > 0.5m, drift is issue)
3. Compare closure error / distance ratio

---

### Hypothesis 4: Camera Calibration Wrong ⚠️ LOW PROBABILITY

**Symptoms:**
- Positions tracked correctly but scaled wrong
- 3m walk becomes 1m or 9m in app

**Where to check:**
```
Browser console (F12):
- Type: localStorage.getItem('cameraCalibration')
- Check focalLengthX, focalLengthY values
- Should be 300-600 pixels typically

src/utils/cameraCalibration.ts (line ~30-60)
- Check focal length estimation formula
- Verify 60° FOV assumption
```

**Test:**
1. Measure actual distance walked (use tape measure)
2. Compare to HUD DIST reading
3. If ratio is consistent (e.g., always 3x off), calibration is wrong

---

## Comprehensive Geometric Shape Test Suite

### Test 1: Small Paths (Millimeter Accuracy)

**Test Case: 10cm x 10cm square**
```
Expected:
  - Waypoints: 4 corners
  - Closure error: < 0.01m (1cm)
  - Compression: > 2x

Command (manual):
  1. Click "Start Flight"
  2. Walk 10cm north, 10cm east, 10cm south, 10cm west
  3. Click "Stop Flight"
  4. Check HUD: X and Y should both be ~0 ± 0.01m
```

**Test Case: 50cm line north**
```
Expected:
  - HUD X: ~0.00 ± 0.005m
  - HUD Y: ~0.50 ± 0.01m
  - Straight path on map
```

---

### Test 2: Typical Paths (Centimeter Accuracy)

**Test Case: 1m x 1m square**
```
Expected:
  - Waypoints: 4-6 corners
  - Closure error: < 0.05m
  - Path shows clear square shape
  - Compression: > 5x

Manual test steps:
  1. Use tape measure to mark 1m x 1m area
  2. Start at corner (0, 0)
  3. Walk to each corner in order
  4. Return to start
  5. On map, final marker should overlap start marker
```

**Test Case: 3m x 3m square (REPORTED ISSUE)**
```
Expected (ACTUAL):
  - Waypoints: Should be 4-8 (ACTUAL: ?)
  - Closure error: Should be < 0.1m (ACTUAL: > 3m ❌)
  - Path should show square (ACTUAL: straight line ❌)

CRITICAL: This is the exact failure case reported!
Needs immediate debugging.
```

**Test Case: 5m line east**
```
Expected:
  - HUD X: ~5.0 ± 0.1m
  - HUD Y: ~0.00 ± 0.05m
  - Map shows straight line with ~50px length (at zoom 100%)
```

---

### Test 3: Heading Changes (Direction Tracking)

**Test Case: 90° right turn**
```
Expected:
  - HUD heading: 0° → 90° (or similar cardinal change)
  - Compass label: N → E (or equivalent)
  - Map shows L-shape path, not straight line

Manual test:
  1. Walk north 2m (heading should show 0° ± 10°)
  2. Stop and turn 90° right
  3. Walk east 2m (heading should show 90° ± 10°)
  4. Check map: should show L-shape, NOT straight line
```

**Test Case: Full 360° rotation**
```
Expected:
  - Start heading: some value (e.g., 45°)
  - End heading: same value ± 5°
  - HUD compass full rotation N→E→S→W→N
  - Map should show circle of movement

Manual test:
  1. Mark a central point
  2. Walk around the point in a circle
  3. Observe heading changes in HUD real-time
  4. If heading doesn't change, flow detection is broken
```

---

### Test 4: Large Paths (Meter/Kilometer Accuracy)

**Test Case: 10m x 10m square**
```
Expected:
  - Closure error: < 0.2m (2% of 10m side)
  - Perimeter: 40m (±0.5m error acceptable)
  - Compression: > 10x
  - Clear square on map with 0.5m ring intervals visible
```

**Test Case: 100m line**
```
Expected:
  - HUD DIST: 100m ± 1m
  - End position: 100m away in tracked direction
  - Compression: > 50x
```

**Test Case: 1km x 1km square (simulation)**
```
Mock data test (no actual walking required):
  - Generate synthetic 1km path
  - Run compressRoute() with max error 1m
  - Verify closure < 5m (acceptable for 4km perimeter)
  - Verify compression > 20x
```

---

## Debugging Checklist

### Level 1: Visual Inspection

- [ ] Start flight, open browser console (F12)
- [ ] Walk in recognizable pattern (square, line, circle)
- [ ] Watch HUD in real-time:
  - [ ] FEAT count (should be 10-100+, not 0-5)
  - [ ] HDG changes with direction (0° → 90° → 180° → 270°)
  - [ ] DIST increases smoothly (not jumping)
  - [ ] X, Y coordinates update consistently

### Level 2: Console Logging

```javascript
// In browser console (F12):
localStorage.getItem('cameraCalibration')
// Check focal length values

debug.status()
// Check logging level

debug.trace()
// Enable full trace logging
// Then walk a known distance
// Check console for "[GPS UPDATE]" messages
```

### Level 3: Code Inspection

Check these files in order:

1. **useCameraMovement.ts (line 150-200)**
   - [ ] Feature detection: are features found? (log feature count)
   - [ ] Feature matching: are features tracked? (log match quality)
   - [ ] Optical flow: is movement detected? (log flow vectors)

2. **opticalFlow.ts (line 250-300)**
   - [ ] Heading calculation: arctan2 correct?
   - [ ] Flow angle: in correct range 0-360°?
   - [ ] Direction: does it match actual movement?

3. **kalmanFilter.ts (line 1-50)**
   - [ ] Filter parameters: Q, R reasonable?
   - [ ] Convergence: does filter stabilize?
   - [ ] Drift: does error accumulate?

### Level 4: Unit Tests

Create mock data tests:

```typescript
// Generate 3m square path with known positions
const mockSquare = generateSquarePath(3, 50);

// Run compression
const result = compressRoute(mockSquare, {
  maxError: 0.1,
  minDistance: 0.2,
  headingThreshold: 15,
});

// Verify
expect(result.waypoints.length).toBeGreaterThanOrEqual(4);
expect(closureError).toBeLessThan(0.1);
expect(compressionRatio).toBeGreaterThan(5);
```

If mock data test PASSES but real tracking FAILS:
- Issue is in camera pipeline (optical flow / sensor data)
- NOT in compression algorithm

---

## Mock Data Test Suite (Pseudocode)

```python
def generate_square_path(side_length, points_per_side=50):
    """Generate synthetic flight path in square shape"""
    # North: (0,0) → (0,side_length)
    # East: (0,side_length) → (side_length,side_length)
    # South: (side_length,side_length) → (side_length,0)
    # West: (side_length,0) → (0,0)
    return points

def test_shape_compression(route, expected_waypoints, expected_closure_error):
    """Test that shape is preserved after compression"""
    compressed = compressRoute(route)
    
    # Verify waypoint count
    assert compressed.waypoints >= expected_waypoints - 2
    
    # Verify closure (start == end for closed paths)
    start = compressed.waypoints[0]
    end = compressed.waypoints[-1]
    closure = distance(start, end)
    assert closure < expected_closure_error
    
    # Verify compression ratio
    ratio = len(route) / len(compressed.waypoints)
    assert ratio > 2  # At least 2x compression
    
    return True

# Test suite
test_cases = [
    ("10cm square", 0.1, 4, 0.01),
    ("50cm square", 0.5, 4, 0.02),
    ("1m square", 1.0, 4, 0.05),
    ("3m square", 3.0, 4, 0.1),    # ← REPORTED FAILURE
    ("10m square", 10.0, 4, 0.2),
    ("1km square", 1000.0, 4, 5.0),
    ("5m line", 5.0, 2, 0.05),
    ("2m circle", 2.0, 8, 0.15),
]

for name, size, expected_pts, expected_closure in test_cases:
    path = generate_square_path(size)
    result = test_shape_compression(path, expected_pts, expected_closure)
    print(f"✓ {name}" if result else f"✗ {name}")
```

---

## Test Execution Instructions

### Quick Test (5 minutes)

1. **Walk 3m x 3m square** (REPRODUCE ISSUE)
   - Use tape measure to mark 3m x 3m area
   - Walk perimeter while watching HUD
   - Check: Does map show square or straight line?
   - Check: Does DIST reach ~12m (perimeter)?
   - Check: Do X,Y coordinates return to start?

2. **Walk 5m straight north**
   - Walk north while watching HUD heading
   - Check: Heading stays ~0° ± 15°?
   - Check: Y coordinate reaches ~5m?
   - Check: X stays near 0?

### Comprehensive Test (30 minutes)

Run all test cases above in sequence, recording:
- Shape on map (square/line/circle correct?)
- Closure error (end pos vs start pos)
- Compression ratio
- FEAT count (were features detected?)
- HDG changes (did heading track movement direction?)

---

## Expected vs Actual Behavior

| Metric | Expected | Actual (v2.8.0) | Status |
|--------|----------|-----------------|--------|
| 3m square closure | < 0.1m | > 3m | ❌ FAIL |
| Square shape | Clear 4 corners | Straight line | ❌ FAIL |
| FEAT count | 20-100+ | ? | UNKNOWN |
| HDG changes | 0° → 90° → 180° → 270° | ? | UNKNOWN |
| 5m line accuracy | X~0, Y~5 | ? | UNKNOWN |
| Compression | > 5x | ? | UNKNOWN |

---

## Next Steps

1. **Immediate:** Run Level 1 debugging (visual inspection with HUD)
2. **High Priority:** Check optical flow heading calculation (Hypothesis 2)
3. **Medium Priority:** Investigate Kalman filter drift (Hypothesis 3)
4. **Create:** Mock data unit tests to isolate algorithm from sensor issues
5. **Document:** Findings in this file with actual vs expected results

---

**Last Updated:** v2.9.1  
**Priority:** CRITICAL (blocks navigation accuracy)  
**Owner:** Map accuracy investigation task
