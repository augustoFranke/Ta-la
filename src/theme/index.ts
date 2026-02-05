import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  isDark: boolean;
};

const THEME_MODE_KEY = '@tala/theme-mode';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_MODE_KEY)
      .then((storedMode) => {
        if (!isMounted || !storedMode) return;
        if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
          setModeState(storedMode);
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(THEME_MODE_KEY, mode).catch(() => null);
  }, [mode]);

  const setMode = useCallback((nextMode: ThemeMode) => {
    setModeState(nextMode);
  }, []);

  const resolvedScheme = mode === 'system' ? (systemScheme ?? 'light') : mode;
  const themeColors = resolvedScheme === 'dark' ? colors.dark : colors.light;

  const value = useMemo(
    () => ({
      mode,
      setMode,
      colors: themeColors,
      typography,
      spacing,
      isDark: resolvedScheme === 'dark',
    }),
    [mode, setMode, themeColors, resolvedScheme]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const systemScheme = useColorScheme();
  const context = useContext(ThemeContext);

  if (!context) {
    const resolvedScheme = systemScheme ?? 'light';
    const themeColors = resolvedScheme === 'dark' ? colors.dark : colors.light;

    return {
      mode: 'system' as ThemeMode,
      setMode: () => null,
      colors: themeColors,
      typography,
      spacing,
      isDark: resolvedScheme === 'dark',
    };
  }

  return context;
}
