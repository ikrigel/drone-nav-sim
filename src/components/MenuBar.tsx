import { useState } from 'react';
import { AppSettings, DebugSettings } from '../types';
import './MenuBar.css';

interface MenuBarProps {
  settings: AppSettings;
  onFontSizeChange: (size: 'small' | 'medium' | 'large' | 'xl' | 'xxl') => void;
  onDebugChange: (debug: Partial<DebugSettings>) => void;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  version: string;
}

export function MenuBar({ settings, onFontSizeChange, onDebugChange, onSettingsChange, version }: MenuBarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div className="menu-bar">
        <button className="menu-btn" onClick={() => setShowSettings(true)} title="Settings">
          ⚙️
        </button>
        <button className="menu-btn" onClick={() => setShowAbout(true)} title="About">
          ℹ️
        </button>
        <button className="menu-btn" onClick={() => setShowHelp(true)} title="Help">
          ❓
        </button>
      </div>

      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div className="modal-content">
            <div className="setting-group">
              <label>Font Size</label>
              <div className="font-size-options">
                {(['small', 'medium', 'large', 'xl', 'xxl'] as const).map(size => (
                  <button
                    key={size}
                    className={`option-btn ${settings.fontSize === size ? 'active' : ''}`}
                    onClick={() => onFontSizeChange(size)}
                  >
                    {size === 'xl' ? 'XL' : size === 'xxl' ? 'XXL' : size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Units</label>
              <div className="unit-options">
                <button
                  className={`option-btn ${settings.units === 'metric' ? 'active' : ''}`}
                  onClick={() => onSettingsChange({ units: 'metric' })}
                >
                  Metric (m, m/s)
                </button>
                <button
                  className={`option-btn ${settings.units === 'imperial' ? 'active' : ''}`}
                  onClick={() => onSettingsChange({ units: 'imperial' })}
                >
                  Imperial (ft, mph)
                </button>
              </div>
            </div>

            <div className="setting-group">
              <label>Camera View</label>
              <div className="debug-options">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={settings.showCamera}
                    onChange={(e) => onSettingsChange({ showCamera: e.target.checked })}
                  />
                  <span>Show Live Camera Feed</span>
                </label>
              </div>
            </div>

            <div className="setting-group">
              <label>Debug Logging</label>
              <div className="debug-options">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={settings.debug.enabled}
                    onChange={(e) => onDebugChange({ enabled: e.target.checked })}
                  />
                  <span>Enable Debug Logs</span>
                </label>

                {settings.debug.enabled && (
                  <div className="debug-level">
                    <label>Log Level</label>
                    <select
                      value={settings.debug.level}
                      onChange={(e) =>
                        onDebugChange({ level: e.target.value as any })
                      }
                    >
                      <option value="trace">Trace (most verbose)</option>
                      <option value="debug">Debug</option>
                      <option value="info">Info</option>
                      <option value="warn">Warn</option>
                      <option value="error">Error (least verbose)</option>
                    </select>
                    <p className="hint">
                      Open browser console (F12) to see logs.
                      <br />
                      Type <code>debug.status()</code> to check status.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showAbout && (
        <Modal title="About" onClose={() => setShowAbout(false)}>
          <div className="modal-content about-content">
            <h3>Drone Navigation Simulator</h3>
            <p>Version {version}</p>
            <div className="about-text">
              <p>
                A real-time drone flight simulator using device sensors for navigation.
              </p>
              <p>
                <strong>Features:</strong>
              </p>
              <ul>
                <li>Accelerometer-based speed calculation</li>
                <li>Camera-based altitude estimation</li>
                <li>Real-time position tracking</li>
                <li>Flight session recording</li>
              </ul>
              <p>
                <strong>Sensors Used:</strong>
              </p>
              <ul>
                <li>Compass (heading)</li>
                <li>Accelerometer (speed/acceleration)</li>
                <li>Gyroscope (rotation rates)</li>
                <li>Camera (altitude estimation)</li>
              </ul>
            </div>
          </div>
        </Modal>
      )}

      {showHelp && (
        <Modal title="Help" onClose={() => setShowHelp(false)}>
          <div className="modal-content help-content">
            <h3>Camera-Based Navigation</h3>

            <div className="help-section">
              <h4>How It Works</h4>
              <p>
                This is <strong>not a simulation</strong>. Your phone IS the drone.
                The camera analyzes real motion to calculate speed, altitude, and position.
              </p>
            </div>

            <div className="help-section">
              <h4>Getting Started</h4>
              <ol>
                <li>Tap <strong>"Start Flight"</strong> button to begin recording</li>
                <li>Allow camera access when prompted</li>
                <li>Move your phone smoothly:
                  <ul>
                    <li><strong>Pan forward/backward</strong> - Camera detects motion</li>
                    <li><strong>Pan left/right</strong> - Lateral movement</li>
                    <li><strong>Move up/down</strong> - Altitude change</li>
                    <li><strong>Rotate</strong> - Changes heading direction</li>
                  </ul>
                </li>
                <li>Camera analyzes optical flow to calculate speed</li>
                <li>Feature tracking determines altitude from scene</li>
                <li>Tap <strong>"Stop Flight"</strong> to end session</li>
              </ol>
            </div>

            <div className="help-section">
              <h4>Real-Time Data Display</h4>
              <ul>
                <li><strong>HDG</strong> - Heading (compass direction)</li>
                <li><strong>SPD</strong> - Real speed in m/s (from optical flow)</li>
                <li><strong>ALT</strong> - Altitude in meters (from scene depth)</li>
                <li><strong>X, Y</strong> - Position coordinates from start</li>
                <li><strong>FLOW</strong> - Optical flow magnitude (pixels)</li>
                <li><strong>FEAT</strong> - Number of tracked features</li>
                <li><strong>VX, VY</strong> - Velocity components</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>How Camera Calculates Speed</h4>
              <p>
                The camera detects features (corners, edges) and tracks how they move between frames.
                This optical flow is converted to real-world speed using:
              </p>
              <p style={{fontSize: '0.9em', fontFamily: 'monospace'}}>
                speed = (pixel_flow × altitude) / focal_length
              </p>
              <p>
                Altitude is estimated from feature positions relative to the horizon.
              </p>
            </div>

            <div className="help-section">
              <h4>Camera Calibration</h4>
              <ul>
                <li>Auto-estimates camera intrinsics on first flight</li>
                <li>Focal length and principal point are calculated</li>
                <li>Calibration persists in browser storage</li>
                <li>Improves accuracy with each flight</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>Tips for Best Results</h4>
              <ul>
                <li>Move slowly and smoothly for accurate tracking</li>
                <li>Point camera at textured scenes (not blank walls)</li>
                <li>Keep consistent lighting during flight</li>
                <li>More features detected = better accuracy</li>
                <li>Open browser console (F12) to enable debug mode</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>Debug Mode</h4>
              <p>
                Enable debug logging in Settings to see detailed calculations in browser console.
              </p>
              <p>
                Type <code>debug.status()</code> in console (F12) to check debug level.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
