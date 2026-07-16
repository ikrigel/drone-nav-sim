# Changelog

All notable changes to the Drone Navigation Simulator are documented in this file.

## [2.9.3] - 2026-07-16

### Added
- 🎥 **Floating Camera Feed** - Live camera display automatically enabled when sensors activated, positioned at bottom-right corner
- 🔍 **Enhanced Diagnostics** - Comprehensive feature detection and matching logging for motion tracking troubleshooting
- ⚠️ **Motion Axis Detection** - Automatic warnings when movement detected only on single axis (heading lock indicator)
- 🎯 **Stream State Management** - Proper camera stream lifecycle across flight stop/start cycles

### Fixed
- 🐛 **Camera Disappearing** - Camera stream now properly managed with React state, appears consistently across flight restarts
- 🐛 **Map Redraw Issue** - Canvas properly redraws when starting new flights in same session
- 🐛 **Stream Ref Stale Closure** - Added explicit stream state tracking to prevent stale stream references
- ✅ **Mobile Camera UX** - Auto-enable camera view, improved stream management for better mobile experience

### Changed
- Updated App.tsx to auto-enable camera when sensors are enabled (showCamera flag)
- Enhanced useCameraMovement hook with proper stream state lifecycle
- Improved diagnostic logging with detailed feature and match reporting

### Technical Details
- **Modified Files:**
  - `src/hooks/useCameraMovement.ts` - Added stream state, enhanced diagnostics
  - `src/App.tsx` - Auto-enable camera on sensor enable
  - `src/components/FlightPlotter.tsx` - Added motion axis detection
  - `src/components/CameraFeed.css` - Camera positioning refinements

### Tests
- ✅ All 25 tests passing
- ✅ Feature detection diagnostics working
- ✅ Stream state management tested across flight cycles

---

## [2.9.2] - 2026-07-16

### Added
- 📍 **Google Maps Style Coordinates** - Reduced decimal precision to 5 places (~1.1m accuracy) matching Google Maps style
- 👤 **Developer Attribution** - About modal now displays "Developer: Igal Krigel" and "Academic Advisor: Professor Dan Feldman"

### Fixed
- 🐛 **Coordinate Precision** - Reduced from 6 to 5 decimal places for cleaner display while maintaining centimeter-level accuracy
- 🐛 **About Modal** - Version properly displayed in modal

### Changed
- Precision management refactored with DISPLAY_PRECISION constant
- HUD overlay and export formats updated to use roundDisplay() function

---

## [2.3.0] - 2026-07-08

### Added
- ✨ **Unit Preferences** - Toggle between metric (m, m/s) and imperial (ft, mph) units in settings
- 📷 **Camera View Toggle** - Option to display live camera feed during flight (foundation for future camera display feature)
- 💾 **Flight Course Export/Import** - Save and load flight courses as JSON files with full metadata
- 🧪 **Simulated Route Tests** - 8 comprehensive Playwright tests for flight route validation in CI/CD pipeline
- 📊 **Route Stability Investigation Guide** - Detailed troubleshooting documentation for route tracking issues

### Fixed
- 🐛 **Mobile Button Overlap** - Added 62px top padding to HUD overlay to prevent menu buttons from covering telemetry data on small screens
- ✅ **Unit Conversion Utilities** - Created universal unit conversion library for metric/imperial support

### Changed
- Updated all version references to 2.3.0 (package.json, App.tsx, tests)
- Enhanced MenuBar component to support additional settings (units, camera view)
- Improved AppSettings type structure with new configuration options

### Technical Details
- **New Files:**
  - `src/utils/flightExport.ts` - Flight course export/import logic
  - `src/utils/unitConversion.ts` - Universal unit conversion utilities
  - `tests/simulated-routes.spec.ts` - Playwright route simulation tests
  - `ROUTE_STABILITY_INVESTIGATION.md` - Troubleshooting guide

- **Modified Files:**
  - `src/types.ts` - Added units and showCamera to AppSettings
  - `src/hooks/useAppSettings.ts` - Added default values for new settings
  - `src/components/MenuBar.tsx` - Added unit and camera view toggles
  - `src/components/HUDOverlay.css` - Fixed mobile button overlap with padding-top
  - `src/App.tsx` - Wired up settings change callbacks

### Known Issues
- ⚠️ **Route Stability** - Flight path may display as straight line instead of actual path when moving through corners (marked CRITICAL, investigation guide provided)
- Navigation tracking needs verification on real devices with varied lighting conditions

### Tests
- ✅ All 17 existing tests passing
- ✅ 8 new simulated route tests added (in simulated-routes.spec.ts)
- ✅ Total test coverage: 25 tests

### Documentation
- Added comprehensive route stability troubleshooting guide
- Documented unit conversion system
- Provided debug checklist for developers

### Next Steps (v2.4.0+)
1. Resolve route stability issue using investigation guide
2. Implement live camera feed display
3. Add flight course save/load UI buttons
4. Add Kalman filter for position smoothing
5. Implement multi-source heading verification

---

## [2.2.0] - 2026-07-07

### Fixed
- Arrow Always Visible during GPS tracking (not just navigation)
- GPS Arrow at Screen Center using CSS fixed positioning
- Satellite Map visible at all zoom levels
- Complete Map Style Selector (Base, Satellite, Topo)
- Responsive Modal Dialogs
- Map Selection Buttons no longer crash app
- Map Rotation centering in compass mode

### Changed
- Map style selector now has radio-button behavior (only one active)

### Tests
- All 519 tests passing

---

## [2.1.0] - 2026-07-06

### Added
- Version 2.1.0 release
- Favicon added (green drone icon)
- Settings modal with font size options (Small, Medium, Large, XL, XXL)
- Debug logging system with console commands
- Help modal with comprehensive camera-based navigation guide
- Flight course tracking with plotter canvas

### Tests
- 17 comprehensive Playwright E2E tests
- GitHub Actions CI/CD with automatic Vercel deployment

---

## [2.0.0] - 2026-07-05

### Initial Release
- Camera-based drone navigation simulator
- Optical flow detection for movement calculation
- Real-time HUD telemetry display
- Flight plotter canvas with trajectory tracking
- Settings panel for sensitivity adjustment
- localStorage persistence for settings
- Responsive design for mobile devices

---

## Technical Stack
- **React 18.2.0** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Playwright** - E2E testing
- **GitHub Actions** - CI/CD pipeline
- **Vercel** - Hosting

## Browser Support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Mobile Chrome, Firefox, Safari

## Development
- HTTPS required for camera access
- DeviceOrientationEvent permission (iOS 13+)
- MediaDevices.getUserMedia for camera stream

---

## Version Numbers

Semantic versioning: MAJOR.MINOR.PATCH

- **MAJOR**: New architecture or breaking changes
- **MINOR**: New features or enhancements
- **PATCH**: Bug fixes

Current version: **2.3.0**  
Latest stable: **2.3.0**  
Development branch: v2.4.0-dev (route stability fixes)
