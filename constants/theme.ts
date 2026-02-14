/**
 * Modern Apothecary Design System
 * A premium pharmaceutical experience with Bento Grid + Soft UI aesthetics
 */

// Core Color Palette
export const colors = {
  // Primary - Deep Charcoal (Backgrounds)
  background: {
    primary: '#1A1A1A',
    secondary: '#242424',
    tertiary: '#2E2E2E',
  },

  // Secondary - Crisp White (Cards & Surfaces)
  surface: {
    primary: '#FFFFFF',
    secondary: '#F8F8F8',
    tertiary: '#F0F0F0',
  },

  // Accent - Golden Yellow (Primary Actions)
  accent: {
    primary: '#F2C855',
    secondary: '#E5B84A',
    tertiary: '#D4A83F',
    light: 'rgba(242, 200, 85, 0.15)',
    ultraLight: 'rgba(242, 200, 85, 0.08)',
  },

  // Semantic Colors
  success: {
    primary: '#4ADE80',
    secondary: '#22C55E',
    light: 'rgba(74, 222, 128, 0.15)',
  },
  warning: {
    primary: '#FBBF24',
    secondary: '#F59E0B',
    light: 'rgba(251, 191, 36, 0.15)',
  },
  error: {
    primary: '#F87171',
    secondary: '#EF4444',
    light: 'rgba(248, 113, 113, 0.15)',
  },
  info: {
    primary: '#60A5FA',
    secondary: '#3B82F6',
    light: 'rgba(96, 165, 250, 0.15)',
  },

  // Text Colors
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    muted: 'rgba(26, 26, 26, 0.5)',
  },

  // Glass/Overlay
  glass: {
    light: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(26, 26, 26, 0.85)',
    blur: 'rgba(255, 255, 255, 0.6)',
  },

  // Border Colors
  border: {
    light: 'rgba(26, 26, 26, 0.08)',
    medium: 'rgba(26, 26, 26, 0.12)',
    dark: 'rgba(26, 26, 26, 0.2)',
  },
} as const;

// Typography Scale (Swiss-inspired hierarchy)
export const typography = {
  // Headlines - Ultra Bold
  display: {
    fontSize: 48,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  h1: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
    lineHeight: 44,
  },
  h2: {
    fontSize: 28,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  h3: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    lineHeight: 24,
  },

  // Body - Clean & Airy
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
    lineHeight: 18,
  },

  // Labels & Captions
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
} as const;

// Spacing Scale (8px base)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Border Radius - Large organic feel
export const radius = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
  // Specific use cases
  card: 32,
  button: 16,
  input: 16,
  pill: 50,
  avatar: 24,
} as const;

// Shadows (Soft UI)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  accent: {
    shadowColor: '#F2C855',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// Animation Presets
export const animations = {
  spring: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  springBouncy: {
    damping: 10,
    mass: 0.9,
    stiffness: 120,
  },
  springSnappy: {
    damping: 20,
    mass: 1,
    stiffness: 250,
  },
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
} as const;

// Bento Grid Sizes
export const bentoSizes = {
  '1x1': { width: '47%', aspectRatio: 1 },
  '2x1': { width: '100%', aspectRatio: 2.2 },
  '1x2': { width: '47%', aspectRatio: 0.45 },
  '2x2': { width: '100%', aspectRatio: 1 },
} as const;

export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  animations,
  bentoSizes,
};

