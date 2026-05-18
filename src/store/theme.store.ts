// src/store/theme.store.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '../types';
import { Appearance } from 'react-native';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  initialize: () => Promise<void>;
}

const THEME_KEY = 'billvault_theme_mode';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  isDark: Appearance.getColorScheme() === 'dark',

  initialize: async () => {
    try {
      const saved = (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      if (saved) {
        const isDark =
          saved === 'dark' || (saved === 'system' && Appearance.getColorScheme() === 'dark');
        set({ mode: saved, isDark });
      }
    } catch {
      // ignore
    }
  },

  setMode: async (mode: ThemeMode) => {
    const isDark =
      mode === 'dark' || (mode === 'system' && Appearance.getColorScheme() === 'dark');
    set({ mode, isDark });
    await AsyncStorage.setItem(THEME_KEY, mode);
  },
}));
