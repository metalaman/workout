/**
 * Design System Tokens
 *
 * All visual constants for the IronLog app. Dark-only theme — both `Colors.dark`
 * and `Colors.light` are identical (no light mode).
 *
 * Import tokens instead of hardcoding values:
 * ```
 * import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
 * ```
 *
 * @module constants/theme
 */
import { Platform } from 'react-native'

/**
 * Color palette. The app uses dark mode exclusively.
 * `Colors.light` mirrors `Colors.dark` — no actual light theme.
 *
 * Key colors:
 * - `accent` (#e8ff47): Primary accent — neon yellow-green
 * - `background` (#0f0f0f): Screen backgrounds — near-black
 * - `surface` (rgba white 4%): Card/container backgrounds
 * - `danger` (#ff6b6b): Destructive actions, errors
 * - `info` (#6bc5ff): Informational elements
 */
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

/**
 * Spacing scale (in pixels).
 * Used for padding, margins, and gaps throughout the app.
 * Compact scale — most UI uses lg (12) or xl (16).
 */
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

/**
 * Border radius scale (in pixels).
 * - `sm`-`xxl`: Incremental rounding for cards, buttons, inputs
 * - `pill` (20): Fully rounded pill shapes (chips, tags)
 * - `full` (9999): Perfect circle (avatars)
 */
export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 20,
  full: 9999,
} as const

/**
 * Font size scale (in pixels).
 * Intentionally compact — body text is 12-13px, titles are 20px.
 * - `xs` (8): Very small labels
 * - `base` (12): Default body text
 * - `title` (20): Screen titles
 * - `hero` (26): Large numbers (strength score, stats)
 */
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

/**
 * Font weight values as string literals (React Native expects strings).
 * Used with `fontWeight` style property.
 */
export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
}

/**
 * Platform-specific font family stacks.
 * Uses system fonts — no custom font files.
 */
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
