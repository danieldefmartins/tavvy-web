// TavvY Design System - Brand Color Scheme
// Supports Light and Dark modes with centralized color management
// This file is a direct port from tavvy-mobile/constants/Colors.ts
// Updated May 2026 — New brand identity (#8A05BE purple + #00C2CB teal)

// ===== BRAND PALETTE =====
const brand = {
  // Primary Brand Colors (from new logo — May 2026 rebrand)
  purple: '#8A05BE',            // Primary brand purple (Nubank-level vivid)
  teal: '#00C2CB',              // Accent teal (front pill of icon)
  dark: '#17013A',              // Dark backgrounds, wordmark

  // Extended brand
  purpleLight: '#D4A0FF',       // Hover states, secondary buttons
  lavender: '#F4F0FF',          // Light mode backgrounds, card surfaces

  // Text on dark backgrounds
  textPrimary: '#F1F5F9',       // Soft white (not pure white)
  textSecondary: '#9394A1',     // Muted gray
  textMuted: '#6B6B80',         // Tertiary text
};

// ===== CORE PALETTE =====
const palette = {
  // Brand Colors
  ...brand,

  // Signal Colors (Tap Categories — new brand-aligned)
  signalGood: '#00C2CB',           // Teal — The Good (positive signals)
  signalVibe: '#8A05BE',           // Purple — The Vibe (contextual signals)
  signalHeadsUp: '#F5A623',        // Amber — Heads Up (warning signals)

  // Signal pill backgrounds (dark mode)
  signalGoodBg: 'rgba(0, 194, 203, 0.12)',
  signalVibeBg: 'rgba(138, 5, 190, 0.12)',
  signalHeadsUpBg: 'rgba(245, 166, 35, 0.12)',

  // Signal pill borders (dark mode)
  signalGoodBorder: 'rgba(0, 194, 203, 0.2)',
  signalVibeBorder: 'rgba(138, 5, 190, 0.2)',
  signalHeadsUpBorder: 'rgba(245, 166, 35, 0.2)',

  // Signal pill text (dark mode)
  signalGoodText: '#5EEAEF',
  signalVibeText: '#C77DFF',
  signalHeadsUpText: '#FFB84D',

  // Signal pill backgrounds (light mode)
  signalGoodBgLight: 'rgba(0, 194, 203, 0.10)',
  signalVibeBgLight: 'rgba(138, 5, 190, 0.08)',
  signalHeadsUpBgLight: 'rgba(245, 166, 35, 0.10)',

  // Signal pill borders (light mode)
  signalGoodBorderLight: 'rgba(0, 194, 203, 0.25)',
  signalVibeBorderLight: 'rgba(138, 5, 190, 0.18)',
  signalHeadsUpBorderLight: 'rgba(245, 166, 35, 0.22)',

  // Semantic Colors
  success: '#36DDB0',              // Mint — verified, success states
  successLight: 'rgba(54, 221, 176, 0.15)',
  warning: '#F5A623',              // Amber — same as Heads Up
  warningLight: 'rgba(245, 166, 35, 0.15)',
  error: '#E53E3E',                // Red — errors, destructive
  errorLight: 'rgba(229, 62, 62, 0.15)',
  info: '#00C2CB',                 // Teal — informational

  // Grayscale
  white: '#FFFFFF',
  black: '#000000',

  // Light Mode Grays
  gray50: '#FAFAFA',
  gray100: '#F4F0FF',              // Lavender light (brand-tinted)
  gray200: '#E8E8EC',
  gray300: '#D1D1D8',
  gray400: '#9394A1',
  gray500: '#6B6B80',
  gray600: '#56576B',
  gray700: '#3D3D50',
  gray800: '#250E45',              // Dark purple surface
  gray900: '#17013A',              // Brand dark

  // Dark Mode Specific (TavvY Purple-Dark scale)
  darkBackground: '#17013A',       // Brand dark
  darkSurface: '#1E0A3C',         // Elevated surface (purple-tinted)
  darkSurfaceElevated: '#250E45', // More elevated
  darkSeparator: 'rgba(255, 255, 255, 0.08)',
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
  primary: brand.purple,
  primaryLight: 'rgba(138, 5, 190, 0.2)',
  secondary: brand.teal,
  secondaryLight: 'rgba(0, 194, 203, 0.2)',

  // Tab Bar
  tabBarBackground: '#0D0127',
  tabBarActive: palette.white,
  tabBarInactive: brand.textSecondary,

  // Cards
  cardBackground: palette.darkSurface,
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  // Signals (Tap Categories — new pill system)
  signalGood: palette.signalGood,
  signalVibe: palette.signalVibe,
  signalHeadsUp: palette.signalHeadsUp,
  signalGoodBg: palette.signalGoodBg,
  signalVibeBg: palette.signalVibeBg,
  signalHeadsUpBg: palette.signalHeadsUpBg,
  signalGoodBorder: palette.signalGoodBorder,
  signalVibeBorder: palette.signalVibeBorder,
  signalHeadsUpBorder: palette.signalHeadsUpBorder,
  signalGoodText: palette.signalGoodText,
  signalVibeText: palette.signalVibeText,
  signalHeadsUpText: palette.signalHeadsUpText,

  // Legacy signal names (for backward compatibility)
  signalPros: palette.signalGood,
  signalUniverse: palette.signalVibe,
  signalCons: palette.signalHeadsUp,
  signalPositive: palette.signalGood,
  signalNeutral: palette.signalVibe,
  signalNegative: palette.signalHeadsUp,

  // Status
  success: palette.success,
  successLight: palette.successLight,
  warning: palette.warning,
  warningLight: palette.warningLight,
  error: palette.error,
  errorLight: palette.errorLight,
  info: palette.info,

  // Map
  mapOverlay: 'rgba(23, 1, 58, 0.92)',

  // Bottom Sheet
  bottomSheetBackground: palette.darkSurface,
  bottomSheetHandle: palette.gray500,

  // Input
  inputBackground: palette.darkSurfaceElevated,
  inputBorder: palette.darkSeparator,
  inputPlaceholder: brand.textMuted,

  // Photo Overlay Gradient
  photoGradientStart: 'transparent',
  photoGradientEnd: 'rgba(23, 1, 58, 0.9)',

  // Brand accent colors
  brandPurple: brand.purple,
  brandTeal: brand.teal,
  // Legacy
  brandBlue: brand.purple,
  brandOrange: brand.teal,
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
  primary: brand.purple,
  primaryLight: 'rgba(138, 5, 190, 0.1)',
  secondary: brand.teal,
  secondaryLight: 'rgba(0, 194, 203, 0.1)',

  // Tab Bar
  tabBarBackground: 'rgba(255, 255, 255, 0.95)',
  tabBarActive: brand.purple,
  tabBarInactive: palette.gray500,

  // Cards
  cardBackground: palette.white,
  cardShadow: 'rgba(0, 0, 0, 0.06)',

  // Signals (Tap Categories — light mode pills)
  signalGood: palette.signalGood,
  signalVibe: palette.signalVibe,
  signalHeadsUp: palette.signalHeadsUp,
  signalGoodBg: palette.signalGoodBgLight,
  signalVibeBg: palette.signalVibeBgLight,
  signalHeadsUpBg: palette.signalHeadsUpBgLight,
  signalGoodBorder: palette.signalGoodBorderLight,
  signalVibeBorder: palette.signalVibeBorderLight,
  signalHeadsUpBorder: palette.signalHeadsUpBorderLight,
  signalGoodText: palette.gray900,
  signalVibeText: palette.gray900,
  signalHeadsUpText: palette.gray900,

  // Legacy signal names (for backward compatibility)
  signalPros: palette.signalGood,
  signalUniverse: palette.signalVibe,
  signalCons: palette.signalHeadsUp,
  signalPositive: palette.signalGood,
  signalNeutral: palette.signalVibe,
  signalNegative: palette.signalHeadsUp,

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
  brandPurple: brand.purple,
  brandTeal: brand.teal,
  // Legacy
  brandBlue: brand.purple,
  brandOrange: brand.teal,
};

// ===== LEGACY COLORS (for backward compatibility) =====
export const Colors = {
  // Light theme (backward compatibility with React Native pattern)
  light: {
    tint: brand.purple,
    background: palette.gray50,
    text: brand.textPrimary,
    textSecondary: brand.textSecondary,
    tabIconDefault: brand.textSecondary,
    tabIconSelected: brand.purple,
  },
  dark: {
    tint: brand.purple,
    background: palette.darkBackground,
    text: brand.textPrimary,
    textSecondary: brand.textSecondary,
    tabIconDefault: brand.textSecondary,
    tabIconSelected: brand.purple,
  },
  // Primary colors
  primary: brand.purple,
  secondary: brand.teal,

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
  tabBarActive: brand.purple,
  tabBarInactive: brand.textSecondary,

  // Review Semantic Themes (TavvY Signal Colors — New Pill System)
  // Teal = The Good (Positive)
  // Purple = The Vibe (Contextual)
  // Amber = Heads Up (Warning)
  positive: {
    primary: '#00C2CB',     // Teal
    light: 'rgba(0, 194, 203, 0.12)',
    bg: 'rgba(0, 194, 203, 0.12)',
    border: 'rgba(0, 194, 203, 0.2)',
    text: '#5EEAEF',
    textLight: '#17013A',   // For light mode
  },
  vibe: {
    primary: '#8A05BE',     // Purple
    light: 'rgba(138, 5, 190, 0.12)',
    bg: 'rgba(138, 5, 190, 0.12)',
    border: 'rgba(138, 5, 190, 0.2)',
    text: '#C77DFF',
    textLight: '#17013A',   // For light mode
  },
  negative: {
    primary: '#F5A623',     // Amber
    light: 'rgba(245, 166, 35, 0.12)',
    bg: 'rgba(245, 166, 35, 0.12)',
    border: 'rgba(245, 166, 35, 0.2)',
    text: '#FFB84D',
    textLight: '#17013A',   // For light mode
  },

  // Brand colors for direct access
  brand: {
    purple: brand.purple,
    teal: brand.teal,
    dark: brand.dark,
    purpleLight: brand.purpleLight,
    lavender: brand.lavender,
    // Legacy aliases
    navy: brand.dark,
    blue: brand.purple,
    blueLight: brand.purpleLight,
    orange: brand.teal,
    orangeLight: brand.teal,
  },
};

// ===== SIGNAL COLORS HELPER =====
export const getSignalColor = (type: 'good' | 'vibe' | 'headsup' | 'pros' | 'universe' | 'cons' | 'positive' | 'neutral' | 'negative', theme: typeof lightTheme) => {
  switch (type) {
    case 'good':
    case 'pros':
    case 'positive':
      return theme.signalGood;
    case 'vibe':
    case 'universe':
    case 'neutral':
      return theme.signalVibe;
    case 'headsup':
    case 'cons':
    case 'negative':
      return theme.signalHeadsUp;
    default:
      return theme.signalVibe;
  }
};

// ===== SIGNAL PILL STYLE HELPER =====
export const getSignalPillStyle = (type: 'good' | 'vibe' | 'headsup', theme: typeof darkTheme) => {
  switch (type) {
    case 'good':
      return {
        background: theme.signalGoodBg,
        border: theme.signalGoodBorder,
        color: theme.signalGoodText,
        accent: theme.signalGood,
      };
    case 'vibe':
      return {
        background: theme.signalVibeBg,
        border: theme.signalVibeBorder,
        color: theme.signalVibeText,
        accent: theme.signalVibe,
      };
    case 'headsup':
      return {
        background: theme.signalHeadsUpBg,
        border: theme.signalHeadsUpBorder,
        color: theme.signalHeadsUpText,
        accent: theme.signalHeadsUp,
      };
    default:
      return {
        background: theme.signalVibeBg,
        border: theme.signalVibeBorder,
        color: theme.signalVibeText,
        accent: theme.signalVibe,
      };
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

// ===== SIGNAL PILL SIZE HELPER =====
export const getSignalPillSize = (tapCount: number): 'lg' | 'md' | 'sm' | 'ghost' => {
  if (tapCount >= 30) return 'lg';
  if (tapCount >= 10) return 'md';
  if (tapCount >= 3) return 'sm';
  return 'ghost';
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
  pill: 100,   // Signal pills
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
  // Signal pill text
  signalPill: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  signalPillLg: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
  signalPillSm: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0,
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
    purple: brand.purple,
    teal: brand.teal,
    dark: brand.dark,
  },
  splash: {
    backgroundColor: brand.dark,
  },
};

// Theme type export
export type Theme = typeof lightTheme;
