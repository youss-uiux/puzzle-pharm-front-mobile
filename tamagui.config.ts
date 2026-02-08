import { createAnimations } from '@tamagui/animations-react-native'
import { createInterFont } from '@tamagui/font-inter'
import { createTamagui } from 'tamagui'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/config/v3'

const animations = createAnimations({
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
})

const headingFont = createInterFont()
const bodyFont = createInterFont()

// Configuration personnalisée pour PuzzlePharm
const customTokens = {
  ...tokens,
  color: {
    ...tokens.color,
    primary: '#2563EB',        // Bleu principal
    primaryLight: '#3B82F6',
    primaryDark: '#1D4ED8',
    secondary: '#10B981',      // Vert santé
    secondaryLight: '#34D399',
    accent: '#F59E0B',         // Orange pour les alertes
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
  },
}

const config = createTamagui({
  animations,
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens: customTokens,
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config

