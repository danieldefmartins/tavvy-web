/**
 * Tavvy V2 Design System
 * 
 * Centralized theme matching iOS Tavvy V2 design
 * Use this across ALL pages for consistency
 * 
 * Usage:
 * import { tavvyTheme } from '@/styles/tavvyTheme';
 * 
 * const { colors, typography, spacing } = tavvyTheme;
 */

export const tavvyTheme = {
  // ============================================
  // COLORS
  // ============================================
  colors: {
    // Background Colors
    background: {
      dark: '#000000',        // Primary dark background (iOS default)
      light: '#FFFFFF',       // Light mode background
      surface: {
        dark: '#1A1A1A',      // Cards, inputs in dark mode
        light: '#F5F5F5',     // Cards, inputs in light mode
      },
      overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
    },

    // Text Colors
    text: {
      primary: {
        dark: '#FFFFFF',
        light: '#000000',
      },
      secondary: {
        dark: '#9CA3AF',      // Gray text in dark mode
        light: '#6B7280',     // Gray text in light mode
      },
      tertiary: {
        dark: '#6B7280',
        light: '#9CA3AF',
      },
    },

    // Brand Colors (Tavvy V2)
    brand: {
      // Universes - Blue
      universes: '#667EEA',
      universesHover: '#5568D3',
      universesLight: 'rgba(102, 126, 234, 0.1)',
      
      // Pros - Purple
      pros: '#8B5CF6',
      prosHover: '#7C3AED',
      prosLight: 'rgba(139, 92, 246, 0.1)',
      
      // Atlas - Indigo
      atlas: '#6366F1',
      atlasHover: '#4F46E5',
      atlasLight: 'rgba(99, 102, 241, 0.1)',
      
      // OnTheGo - Cyan
      onthego: '#22D3EE',
      onthegoHover: '#06B6D4',
      onthegoLight: 'rgba(34, 211, 238, 0.1)',
    },

    // Status Colors
    status: {
      active: '#EF4444',      // Red - Live/Active indicator
      success: '#10B981',     // Green
      warning: '#F59E0B',     // Orange
      error: '#EF4444',       // Red
      info: '#3B82F6',        // Blue
    },

    // Interactive Elements
    interactive: {
      primary: '#667EEA',     // Primary buttons
      primaryHover: '#5568D3',
      secondary: '#6B7280',   // Secondary buttons
      secondaryHover: '#4B5563',
      disabled: '#374151',
    },

    // Borders
    border: {
      dark: '#374151',
      light: '#E5E7EB',
      focus: '#667EEA',
    },
  },

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    // Font Families
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", "Fira Code", "Droid Sans Mono", "Source Code Pro", monospace',
    },

    // Font Sizes
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px',
    },

    // Font Weights
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },

    // Letter Spacing
    letterSpacing: {
      tight: '-0.5px',
      normal: '0',
      wide: '0.5px',
    },
  },

  // ============================================
  // SPACING
  // ============================================
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
    '6xl': '64px',
  },

  // ============================================
  // BORDER RADIUS
  // ============================================
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    full: '9999px',
  },

  // ============================================
  // SHADOWS
  // ============================================
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // ============================================
  // TRANSITIONS
  // ============================================
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // ============================================
  // Z-INDEX
  // ============================================
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get colors for current theme mode
 */
export const getThemeColors = (isDark: boolean = true) => {
  const { colors } = tavvyTheme;
  
  return {
    background: isDark ? colors.background.dark : colors.background.light,
    surface: isDark ? colors.background.surface.dark : colors.background.surface.light,
    text: isDark ? colors.text.primary.dark : colors.text.primary.light,
    textSecondary: isDark ? colors.text.secondary.dark : colors.text.secondary.light,
    textTertiary: isDark ? colors.text.tertiary.dark : colors.text.tertiary.light,
    border: isDark ? colors.border.dark : colors.border.light,
    accent: colors.brand.universes,
    // Tab bar colors
    tabBarBackground: isDark ? '#000000' : '#FFFFFF',
    tabBarActive: isDark ? '#FFFFFF' : '#000000',
    tabBarInactive: isDark ? '#6B7280' : '#9CA3AF',
    // Card backgrounds
    cardBackground: isDark ? colors.background.surface.dark : colors.background.surface.light,
    // Primary color
    primary: colors.brand.universes,
    primaryLight: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)',
  };
};

// TypeScript type for the theme object
export type Theme = ReturnType<typeof getThemeColors>;

/**
 * Get brand color for specific section
 */
export const getBrandColor = (section: 'universes' | 'pros' | 'atlas' | 'onthego') => {
  return tavvyTheme.colors.brand[section];
};

// Export individual parts for convenience
export const { colors, typography, spacing, borderRadius, shadows, transitions, zIndex } = tavvyTheme;

// Export default
export default tavvyTheme;
