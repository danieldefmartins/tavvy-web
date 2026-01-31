import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getThemeColors, tavvyTheme } from '../styles/tavvyTheme';
import type { Theme } from '../styles/tavvyTheme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@tavvy_theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
    
    // Listen for system theme changes
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemPrefersDark(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);

  const loadThemePreference = () => {
    try {
      if (typeof window !== 'undefined') {
        const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setThemeMode = (mode: ThemeMode) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
      }
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine if we should use dark theme
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);
  
  // Select the appropriate theme
  const theme = getThemeColors(isDark);

  // Don't render until we've loaded the saved preference (prevents flash)
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

// Export a simple hook that just returns the theme object
export function useAppTheme() {
  const { theme } = useThemeContext();
  return theme;
}
