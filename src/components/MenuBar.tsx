import { useState } from 'react';
import { AppSettings, DebugSettings } from '../types';
import './MenuBar.css';

interface MenuBarProps {
  settings: AppSettings;
  onFontSizeChange: (size: 'small' | 'medium' | 'large') => void;
  onDebugChange: (debug: Partial<DebugSettings>) => void;
  version: string;
}

export function MenuBar({ settings, onFontSizeChange, onDebugChange, version }: MenuBarProps) {
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
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    className={`option-btn ${settings.fontSize === size ? 'active' : ''}`}
                    onClick={() => onFontSizeChange(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
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
            <h3>How to Use</h3>

            <div className="help-section">
              <h4>Getting Started</h4>
              <ol>
                <li>Tap "Enable Sensors" to request device permissions</li>
                <li>Tap "Start Flight" to begin recording</li>
                <li>Move your device to simulate flight:
                  <ul>
                    <li><strong>Tilt forward/back</strong> - Accelerate forward/back</li>
                    <li><strong>Tilt left/right</strong> - Accelerate left/right</li>
                    <li><strong>Roll device</strong> - Vertical acceleration</li>
                    <li><strong>Rotate device</strong> - Change heading (compass)</li>
                  </ul>
                </li>
                <li>Tap "Stop Flight" to end the session</li>
              </ol>
            </div>

            <div className="help-section">
              <h4>Understanding the Display</h4>
              <ul>
                <li><strong>Radar Plot</strong> - Top-down view of your flight path</li>
                <li><strong>Arrow</strong> - Your current heading (direction)</li>
                <li><strong>HUD</strong> - Real-time telemetry (speed, altitude, time)</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>Sensors & Data</h4>
              <ul>
                <li><strong>Speed</strong> - Calculated from accelerometer</li>
                <li><strong>Altitude</strong> - Estimated from camera brightness</li>
                <li><strong>Position</strong> - Integrated from acceleration</li>
              </ul>
            </div>

            <div className="help-section">
              <h4>Debug Mode</h4>
              <p>
                Enable debug logging in Settings to see detailed sensor data in the browser console (F12).
              </p>
              <p>
                Type <code>debug.status()</code> in console to check current debug level.
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
