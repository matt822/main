"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { DEFAULT_SETTINGS, type DashboardSettings } from "@/types";

const STORAGE_KEY = "dashboard-settings";

interface SettingsContextValue {
  settings: DashboardSettings;
  updateSettings: (partial: Partial<DashboardSettings>) => void;
  isLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  isLoaded: false,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // ignore invalid JSON
    }
    setIsLoaded(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<DashboardSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage full or unavailable
      }
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
