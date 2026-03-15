import { Platform } from 'react-native'

export const Colors = {
  dark: {
    background: '#0f0f0f',
    surface: 'rgba(255,255,255,0.04)',
    surfaceLight: 'rgba(255,255,255,0.06)',
    accent: '#e8ff47',
    accentDark: '#a8e000',
    accentGreen: '#7fff00',
    accentSurface: 'rgba(232,255,71,0.06)',
    accentSurfaceActive: 'rgba(232,255,71,0.12)',
    accentBorder: 'rgba(232,255,71,0.15)',
    accentBorderStrong: 'rgba(232,255,71,0.4)',
    text: '#ffffff',
    textSecondary: '#888888',
    textMuted: '#555555',
    textDark: '#444444',
    textOnAccent: '#0a0a0a',
    border: 'rgba(255,255,255,0.06)',
    borderLight: 'rgba(255,255,255,0.1)',
    danger: '#ff6b6b',
    info: '#6bc5ff',
    black: '#0a0a0a',
    tabBar: '#0f0f0f',
    icon: '#9BA1A6',
    tint: '#e8ff47',
    tabIconDefault: '#555555',
    tabIconSelected: '#e8ff47',
  },
  light: {
    background: '#0f0f0f',
    surface: 'rgba(255,255,255,0.04)',
    surfaceLight: 'rgba(255,255,255,0.06)',
    accent: '#e8ff47',
    accentDark: '#a8e000',
    accentGreen: '#7fff00',
    accentSurface: 'rgba(232,255,71,0.06)',
    accentSurfaceActive: 'rgba(232,255,71,0.12)',
    accentBorder: 'rgba(232,255,71,0.15)',
    accentBorderStrong: 'rgba(232,255,71,0.4)',
    text: '#ffffff',
    textSecondary: '#888888',
    textMuted: '#555555',
    textDark: '#444444',
    textOnAccent: '#0a0a0a',
    border: 'rgba(255,255,255,0.06)',
    borderLight: 'rgba(255,255,255,0.1)',
    danger: '#ff6b6b',
    info: '#6bc5ff',
    black: '#0a0a0a',
    tabBar: '#0f0f0f',
    icon: '#9BA1A6',
    tint: '#e8ff47',
    tabIconDefault: '#555555',
    tabIconSelected: '#e8ff47',
  },
} as const

export const Spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  xxxxl: 32,
} as const

export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 20,
  full: 9999,
} as const

export const FontSize = {
  xs: 8,
  sm: 10,
  md: 11,
  base: 12,
  lg: 13,
  xl: 14,
  xxl: 16,
  title: 20,
  hero: 26,
} as const

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
})
