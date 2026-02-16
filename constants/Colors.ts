// TavvY Design System - Brand Color Scheme
// Supports Light and Dark modes with centralized color management
// This file is a direct port from tavvy-mobile/constants/Colors.ts

// ===== BRAND PALETTE =====
const brand = {
  // Primary Brand Colors (from logo)
  navy: '#0F1233',           // Primary background
  blue: '#3B82F6',           // Signal blue (icon left)
  blueLight: '#60A5FA',      // Blue glow/highlight
  orange: '#F97316',         // Signal orange (icon right)
  orangeLight: '#FB923C',    // Orange glow/highlight
  
  // Text on dark backgrounds
  textPrimary: '#F1F5F9',    // Soft white (not pure white)
  textSecondary: '#94A3B8',  // Slate 400
  textMuted: '#64748B',      // Slate 500
};

// ===== CORE PALETTE =====
const palette = {
  // Brand Colors
  ...brand,
  
  // Signal Colors (Tap Categories)
  signalPros: '#10B981',        // Emerald green - positive signals
  signalUniverse: '#0EA5E9',    // Sky blue - context/universe signals
  signalCons: '#F59E0B',        // Amber - warning/cons signals
  
  // Semantic Colors
  success: '#10B981',           // Same as Pros
  successLight: '#D1FAE5',
  warning: '#F59E0B',           // Same as Cons
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#0EA5E9',              // Same as Universe

  // Grayscale
  white: '#FFFFFF',
  black: '#000000',
  
  // Light Mode Grays (Slate scale)
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Dark Mode Specific (TavvY Navy scale)
  darkBackground: '#0F1233',      // TavvY Navy
  darkSurface: '#1E293B',         // Elevated surface
  darkSurfaceElevated: '#334155', // More elevated
  darkSeparator: '#334155',       // Borders
};

// ===== DARK THEME (Primary for TavvY) =====
export const darkTheme = {
  // Backgrounds
  background: palette.darkBackground,
  surface: palette.darkSurface,
  surfaceElevated: palette.darkSurfaceElevated,
  
  // Text
  text: brand.textPrimary,
  textSecondary: brand.textSecondary,
  textTertiary: brand.textMuted,
  textInverse: palette.black,
  
  // Borders & Separators
  border: palette.darkSeparator,
  separator: palette.darkSeparator,
  
  // Interactive Elements
  primary: brand.blue,
  primaryLight: 'rgba(59, 130, 246, 0.2)',
  secondary: brand.orange,
  
  // Tab Bar
  tabBarBackground: '#000000',
  tabBarActive: palette.white,
  tabBarInactive: brand.textSecondary,
  
  // Cards
  cardBackground: palette.darkSurface,
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  
  // Signals (Tap Categories)
  signalPros: palette.signalPros,
  signalUniverse: palette.signalUniverse,
  signalCons: palette.signalCons,
  
  // Legacy signal names (for compatibility)
  signalPositive: palette.signalPros,
  signalNeutral: palette.signalUniverse,
  signalNegative: palette.signalCons,
  
  // Status
  success: palette.success,
  successLight: 'rgba(16, 185, 129, 0.2)',
  warning: palette.warning,
  warningLight: 'rgba(245, 158, 11, 0.2)',
  error: palette.error,
  errorLight: 'rgba(239, 68, 68, 0.2)',
  info: palette.info,
  
  // Map
  mapOverlay: 'rgba(15, 18, 51, 0.92)',
  
  // Bottom Sheet
  bottomSheetBackground: palette.darkSurface,
  bottomSheetHandle: palette.gray600,
  
  // Input
  inputBackground: palette.darkSurfaceElevated,
  inputBorder: palette.darkSeparator,
  inputPlaceholder: brand.textMuted,
  
  // Photo Overlay Gradient
  photoGradientStart: 'transparent',
  photoGradientEnd: 'rgba(15, 18, 51, 0.9)',
  
  // Brand accent colors
  brandBlue: brand.blue,
  brandOrange: brand.orange,
};

// ===== LIGHT THEME =====
export const lightTheme = {
  // Backgrounds
  background: palette.white,
  surface: palette.gray50,
  surfaceElevated: palette.white,
  
  // Text
  text: palette.gray900,
  textSecondary: palette.gray500,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  
  // Borders & Separators
  border: palette.gray200,
  separator: palette.gray200,
  
  // Interactive Elements
  primary: brand.blue,
  primaryLight: 'rgba(59, 130, 246, 0.1)',
  secondary: brand.orange,
  
  // Tab Bar
  tabBarBackground: 'rgba(255, 255, 255, 0.95)',
  tabBarActive: brand.blue,
  tabBarInactive: palette.gray500,
  
  // Cards
  cardBackground: palette.white,
  cardShadow: 'rgba(0, 0, 0, 0.1)',
  
  // Signals (Tap Categories)
  signalPros: palette.signalPros,
  signalUniverse: palette.signalUniverse,
  signalCons: palette.signalCons,
  
  // Legacy signal names (for compatibility)
  signalPositive: palette.signalPros,
  signalNeutral: palette.signalUniverse,
  signalNegative: palette.signalCons,
  
  // Status
  success: palette.success,
  successLight: palette.successLight,
  warning: palette.warning,
  warningLight: palette.warningLight,
  error: palette.error,
  errorLight: palette.errorLight,
  info: palette.info,
  
  // Map
  mapOverlay: 'rgba(255, 255, 255, 0.92)',
  
  // Bottom Sheet
  bottomSheetBackground: palette.gray50,
  bottomSheetHandle: palette.gray300,
  
  // Input
  inputBackground: palette.gray100,
  inputBorder: palette.gray300,
  inputPlaceholder: palette.gray500,
  
  // Photo Overlay Gradient
  photoGradientStart: 'transparent',
  photoGradientEnd: 'rgba(0, 0, 0, 0.7)',
  
  // Brand accent colors
  brandBlue: brand.blue,
  brandOrange: brand.orange,
};

// ===== LEGACY COLORS (for backward compatibility) =====
export const Colors = {
  // Light theme (backward compatibility with React Native pattern)
  light: {
    tint: brand.blue,
    background: palette.gray50,
    text: brand.textPrimary,
    textSecondary: brand.textSecondary,
    tabIconDefault: brand.textSecondary,
    tabIconSelected: brand.blue,
  },
  dark: {
    tint: brand.blue,
    background: palette.darkBackground,
    text: brand.textPrimary,
    textSecondary: brand.textSecondary,
    tabIconDefault: brand.textSecondary,
    tabIconSelected: brand.blue,
  },
  // Primary colors
  primary: brand.blue,
  secondary: brand.orange,
  
  // Backgrounds
  background: palette.darkBackground,
  surface: palette.darkSurface,
  
  // Text
  text: brand.textPrimary,
  textSecondary: brand.textSecondary,
  
  // Borders
  border: palette.darkSeparator,
  inputBorder: palette.darkSeparator,
  
  // Status colors
  error: palette.error,
  success: palette.success,
  warning: palette.warning,
  
  // Basic colors
  white: palette.white,
  black: palette.black,
  
  // Tab bar
  tabBarActive: brand.blue,
  tabBarInactive: brand.textSecondary,

  // Review Semantic Themes (TavvY Signal Colors)
  // Blue = The Good (Positive)
  // Purple/Gray = The Vibe (Neutral)
  // Orange = Heads Up (Negative)
  positive: {
    primary: '#0A84FF',  // Apple Blue
    light: 'rgba(10, 132, 255, 0.15)',
    text: '#FFFFFF',
  },
  vibe: {
    primary: '#8B5CF6',  // Purple
    light: 'rgba(139, 92, 246, 0.15)',
    text: '#FFFFFF',
  },
  negative: {
    primary: '#FF9500',  // Apple Orange
    light: 'rgba(255, 149, 0, 0.15)',
    text: '#FFFFFF',
  },
  
  // Brand colors for direct access
  brand: {
    navy: brand.navy,
    blue: brand.blue,
    blueLight: brand.blueLight,
    orange: brand.orange,
    orangeLight: brand.orangeLight,
  },
};

// ===== SIGNAL COLORS HELPER =====
export const getSignalColor = (type: 'pros' | 'universe' | 'cons' | 'positive' | 'neutral' | 'negative', theme: typeof lightTheme) => {
  switch (type) {
    case 'pros':
    case 'positive':
      return theme.signalPros;
    case 'universe':
    case 'neutral':
      return theme.signalUniverse;
    case 'cons':
    case 'negative':
      return theme.signalCons;
    default:
      return theme.signalUniverse;
  }
};

// ===== TAP INTENSITY HELPER =====
export const getTapIntensityOpacity = (taps: 1 | 2 | 3): number => {
  switch (taps) {
    case 1:
      return 0.5;
    case 2:
      return 0.75;
    case 3:
      return 1.0;
    default:
      return 1.0;
  }
};

// ===== DESIGN TOKENS =====
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = {
  // Large titles
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: 0.37,
  },
  // Title 1
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.36,
  },
  // Title 2
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: 0.35,
  },
  // Title 3
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0.38,
  },
  // Headline
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  // Body
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  // Callout
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  // Subhead
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  // Footnote
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  // Caption 1
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  // Caption 2
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },
};

// ===== SHADOWS (CSS box-shadow format) =====
export const shadows = {
  small: '0 1px 2px rgba(0, 0, 0, 0.1)',
  medium: '0 2px 8px rgba(0, 0, 0, 0.15)',
  large: '0 4px 16px rgba(0, 0, 0, 0.2)',
};

// ===== BRAND CONFIG (for logo and assets) =====
export const brandConfig = {
  colors: {
    navy: brand.navy,
    blue: brand.blue,
    orange: brand.orange,
  },
  splash: {
    backgroundColor: brand.navy,
  },
};

// Theme type export
export type Theme = typeof lightTheme;
