import { create } from 'zustand';
import { settingsOperations } from './database';
import { useEffect } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeSettingsState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeSettingsStore = create<ThemeSettingsState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));

export async function loadThemeFromDB() {
  const theme = await settingsOperations.get('theme');
  if (theme === 'light' || theme === 'dark') {
    useThemeSettingsStore.getState().setTheme(theme);
  } else {
    // Fallback to system preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    useThemeSettingsStore.getState().setTheme(systemTheme);
  }
}

export function usePersistThemeSetting() {
  useEffect(() => {
    const unsub = useThemeSettingsStore.subscribe((state, prevState) => {
      if (state.theme !== prevState.theme) {
        settingsOperations.set('theme', state.theme);
      }
    });
    return unsub;
  }, []);
} 