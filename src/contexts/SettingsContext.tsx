import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Settings, LicenseInfo } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

// Check if running in Electron
const isElectron = typeof window !== 'undefined' && window.isElectron;
const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

interface SettingsContextValue {
  settings: Settings;
  licenseInfo: LicenseInfo;
  updateSettings: (newSettings: Settings) => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({ licensed: false, tier: 'free' });

  const loadSettings = useCallback(async () => {
    if (isElectron && electronAPI) {
      try {
        const savedSettings = await electronAPI.settings.load();
        if (savedSettings) {
          setSettings(prev => ({ ...prev, ...savedSettings }));
        }

        const license = await electronAPI.license.check();
        if (license) {
          setLicenseInfo(license);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Settings) => {
    setSettings(newSettings);

    if (isElectron && electronAPI) {
      try {
        await electronAPI.settings.save(newSettings);
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return (
    <SettingsContext.Provider value={{ settings, licenseInfo, updateSettings, loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
