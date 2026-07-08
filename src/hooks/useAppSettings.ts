import { useState, useCallback, useEffect } from 'react';
import { AppSettings, DebugSettings } from '../types';
import { safeStorageGet, safeStorageSet } from '../utils/storage';

const DEFAULT_SETTINGS: AppSettings = {
  fontSize: 'medium',
  debug: {
    enabled: false,
    level: 'info',
  },
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load settings on mount
  useEffect(() => {
    const stored = safeStorageGet('drone-nav:settings:v1', DEFAULT_SETTINGS);
    setSettings(stored);
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      safeStorageSet('drone-nav:settings:v1', newSettings);
      return newSettings;
    });
  }, []);

  const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
    updateSettings({ fontSize: size });
  }, [updateSettings]);

  const setDebugSettings = useCallback((debug: Partial<DebugSettings>) => {
    updateSettings({
      debug: { ...settings.debug, ...debug },
    });
  }, [settings.debug, updateSettings]);

  const toggleDebug = useCallback(() => {
    setDebugSettings({ enabled: !settings.debug.enabled });
  }, [settings.debug.enabled, setDebugSettings]);

  return {
    settings,
    updateSettings,
    setFontSize,
    setDebugSettings,
    toggleDebug,
  };
}
