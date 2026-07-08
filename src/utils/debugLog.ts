import { DebugSettings } from '../types';

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

class DebugLogger {
  private settings: DebugSettings = {
    enabled: false,
    level: 'info',
  };

  private history: Array<{ level: LogLevel; msg: string; ts: number }> = [];
  private maxHistory = 500;

  constructor() {
    this.loadSettings();
    this.setupWindowProxy();
  }

  private loadSettings() {
    try {
      const stored = localStorage.getItem('drone-nav:debug:v1');
      if (stored) {
        this.settings = JSON.parse(stored);
      }
    } catch (e) {
      // localStorage unavailable
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('drone-nav:debug:v1', JSON.stringify(this.settings));
    } catch (e) {
      // localStorage unavailable
    }
  }

  private setupWindowProxy() {
    const self = this;
    (window as any).debug = {
      trace(msg: string) { self.log('trace', msg); },
      debug(msg: string) { self.log('debug', msg); },
      info(msg: string) { self.log('info', msg); },
      warn(msg: string) { self.log('warn', msg); },
      error(msg: string) { self.log('error', msg); },
      enable() { self.setEnabled(true); },
      disable() { self.setEnabled(false); },
      setLevel(level: LogLevel) { self.setLevel(level); },
      status() { return self.getStatus(); },
      history() { return self.history; },
      clear() { self.history = []; },
    };
  }

  log(level: LogLevel, msg: string) {
    if (!this.settings.enabled) return;
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.settings.level]) return;

    const ts = Date.now();
    this.history.push({ level, msg, ts });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const prefix = `[${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, msg);
    } else if (level === 'warn') {
      console.warn(prefix, msg);
    } else {
      console.log(prefix, msg);
    }
  }

  setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  setLevel(level: LogLevel) {
    this.settings.level = level;
    this.saveSettings();
  }

  getStatus() {
    return {
      enabled: this.settings.enabled,
      level: this.settings.level,
      historyCount: this.history.length,
    };
  }

  getSettings() {
    return { ...this.settings };
  }

  setSettings(settings: Partial<DebugSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.saveSettings();
  }
}

export const debugLogger = new DebugLogger();

export const log = {
  trace: (msg: string) => debugLogger.log('trace', msg),
  debug: (msg: string) => debugLogger.log('debug', msg),
  info: (msg: string) => debugLogger.log('info', msg),
  warn: (msg: string) => debugLogger.log('warn', msg),
  error: (msg: string) => debugLogger.log('error', msg),
};
