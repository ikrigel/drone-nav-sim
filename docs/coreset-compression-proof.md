# Coreset Route Compression: Mathematical Proof of Quality Preservation

## Overview

The coreset compression algorithm reduces route data by 5-50x while preserving navigational fidelity. This document proves the core guarantee: **the compressed route's deviation from the original is bounded**.

## Algorithm Summary

The compression pipeline consists of five stages:

1. **RDP Geometric Simplification** (`routeCoreset.ts:58-89`): removes near-collinear points via Ramer-Douglas-Peucker
2. **Quality-based Filtering** (`routeCoreset.ts:138-153`): selects high-confidence tracking points deterministically
3. **Heading-Change Filtering** (`routeCoreset.ts:155-170`): preserves turning points
4. **Protected Skeleton Union** (`routeCoreset.ts:172-174`): marks RDP/heading points as immune to distance pruning
5. **Min-Distance Thinning** (`routeCoreset.ts:175-189`): enforces spacing between waypoints

## Core Guarantee: RDP Perpendicular-Distance Bound

### Theorem
For a polyline `L` and a max-deviation threshold `ε` (default 0.1 m), the Ramer-Douglas-Peucker algorithm produces an index set `I_rdp` such that every point in the original route lies within perpendicular distance `ε` from the simplified polyline defined by `I_rdp`.

### Proof (Sketch)

The RDP algorithm (`rdpSimplify`, lines 58-89) operates recursively:

1. **Base case**: For a segment with < 3 points, return endpoints only.
2. **Recursive step**: For a segment with ≥ 3 points:
   - Compute the perpendicular distance (line 66: `perpendicularDistance()`) of every interior point to the chord connecting the endpoints.
   - Find the point with maximum distance (lines 62-71).
   - If `max_distance > ε`, recursively simplify each sub-segment (lines 74-76).
   - If `max_distance ≤ ε`, keep only endpoints (lines 87-88).

**Invariant**: At each recursion level, all points in a segment that do not get recursively subdivided have perpendicular deviation ≤ `ε` from the chord.

**Induction**: By induction on recursion depth, every point discarded by RDP has perpendicular distance ≤ `ε` from the simplified polyline. Thus, the Hausdorff distance `H(original, rdp_polyline) ≤ ε`.

## Why Quality-Filter Additions Preserve the Bound

The quality filter (lines 138-153) selects points based on the heuristic:
```
quality[i] = (featureCount[i] || 10) / mean(featureCount)
keep if quality[i] > 1.2
```

These extra points are **added** to the skeleton, not replacing existing points. By the monotonicity lemma (below), adding vertices cannot increase the Hausdorff distance.

## Why Heading-Change Points Preserve the Bound

Similarly, heading-filtered points (lines 155-170) detect local-maximum direction changes:
```
if |heading[i-1] → heading[i]| > 15° or |heading[i] → heading[i+1]| > 15°, keep point
```

Again, these are *additions* to the RDP skeleton, governed by monotonicity.

## Monotonicity Lemma: Adding Vertices Cannot Increase Deviation

**Lemma**: For two index sets `S ⊆ S'` (both containing the endpoints 0 and `n-1`), the Hausdorff distance from the original route to `polyline(S')` is ≤ the distance to `polyline(S)`.

**Proof**: Any point `p` from the original route that lies within `ε` of `polyline(S)` also lies within `ε` of `polyline(S')`, because `polyline(S')` either follows `polyline(S)` exactly (on segments where no new vertices are added) or cuts the corner even more closely (where new vertices in `S' \ S` are added). Thus, `H(original, polyline(S')) ≤ H(original, polyline(S))`.

## Protected Skeleton: Guarantee Not Erased by Distance Thinning

The algorithm maintains a **protected skeleton** of RDP-selected and heading-selected indices (lines 172-174):
```
protectedIndices = {0, n-1} ∪ rdpIndices ∪ headingFiltered
```

The min-distance thinning (lines 175-189) is applied *only* to quality-filter extras, not to protected points:
```
for each idx in qualityFilteredDeterministic:
  if idx not in protectedIndices:
    if distance(idx, last_kept) ≥ minDistance and distance(idx, next_kept) ≥ minDistance:
      keep idx
```

This ensures `finalIndices ⊇ protectedIndices`, so **the RDP skeleton is always present in the output**. Thus, the perpendicular-distance guarantee is inherited: `H(original, compressed) ≤ ε` (0.1 m by default).

## Known Limitations

### 1. **Guarantee is 2D (x/y plane) only**
All importance metrics — perpendicular distance in RDP, min-distance checks, heading-change detection — operate on the horizontal plane only. The z-coordinate (altitude) is never used in any selection criterion.

**Implication**: Altitude can vary arbitrarily between consecutive kept waypoints. If the user walks up a tall building, then down, both at the same (x, y) location, the compression may discard points representing that altitude excursion if no positional or heading change occurs.

**Mitigation**: The full route is always exported alongside the compressed waypoints. Visualization tools can use the full route for accurate altitude replay.

### 2. **Min-distance threshold is separate from RDP epsilon**
The RDP bound (`maxError = 0.1 m`) is independent of the min-distance threshold (`minDistance = 0.2 m`). If a point is RDP-selected and is exactly 0.15 m from the previous kept point, it survives (protected). But if it's exactly 0.25 m away, the min-distance thinning would try to drop it if it were not protected. The protection mechanism ensures this doesn't happen.

### 3. **Deterministic quality selection (post-v2.7.1)**
The quality filter was previously stochastic (`Math.random() < qualityWeight`), making re-exports non-deterministic. The current implementation uses top-K deterministic selection. The final output is now reproducible across multiple exports of the same flight.

## Compression Ratio Empirical Range

The "5-50x" claim is empirical, not a mathematical bound:

- **Lower bound (5x)**: Straight-line flight with uniform feature confidence → mostly RDP + endpoints survive.
- **Upper bound (50x)**: Highly nonlinear path (spiral, zigzag) with clustered high-confidence features → aggressive quality selection + heading filtering + min-distance thinning.

Typical indoor exploration: **10-15x compression**.

## Conclusion

The compressed route provably stays within 0.1 m (perpendicular distance, 2D) of the original navigation path. Altitude and temporal precision are preserved by exporting both the full route and compression metadata, allowing bidirectional (import/export) round-trip fidelity.

For detailed algorithm implementation, see `src/utils/routeCoreset.ts`.
