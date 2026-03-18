/**
 * Utility Functions
 *
 * Pure helper functions used across the app for calculations and formatting.
 * No side effects, no state, no Appwrite calls.
 *
 * @module lib/utils
 */

/**
 * Calculate estimated 1-rep max using Epley formula.
 * Formula: weight × (1 + reps/30)
 *
 * @param weight - Weight lifted (lbs or kg)
 * @param reps - Number of reps performed
 * @returns Estimated 1RM, rounded to nearest integer
 *
 * @example
 * calculate1RM(225, 5) // → 263 (Epley: 225 × 1.167)
 * calculate1RM(315, 1) // → 315 (1RM is just the weight)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Calculate total volume for a set.
 *
 * @param weight - Weight lifted
 * @param reps - Number of reps
 * @returns Volume (weight × reps)
 */
export function calculateVolume(weight: number, reps: number): number {
  return weight * reps
}

/**
 * Format seconds into MM:SS display string.
 *
 * @param seconds - Total elapsed seconds
 * @returns Formatted string like "45:03"
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format volume number with K suffix for thousands.
 *
 * @param volume - Raw volume number
 * @returns Formatted string like "12.5k" or "850"
 */
export function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(volume % 1000 === 0 ? 0 : 1)}k`
  }
  return volume.toLocaleString()
}

/**
 * Format weight with locale-aware number formatting.
 *
 * @param weight - Weight value
 * @returns Formatted string like "1,250"
 */
export function formatWeight(weight: number): string {
  return weight.toLocaleString()
}

/**
 * Get time-of-day greeting.
 *
 * @returns "Good morning" (before noon), "Good afternoon" (noon-5pm), or "Good evening"
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Format a date as uppercase day-of-week + short date.
 *
 * @param date - Date to format (defaults to now)
 * @returns String like "MONDAY, JUN 16"
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase()
}

/**
 * Get human-readable relative time string.
 *
 * @param dateString - ISO date string
 * @returns Relative time like "5m ago", "3h ago", "Yesterday", "Jun 10"
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Get current day of week as 0-indexed Monday-based number.
 * Monday=0, Tuesday=1, ..., Sunday=6
 *
 * Used by home screen to determine which program day to show.
 *
 * @returns Number 0-6
 */
export function getDayOfWeek(): number {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

/**
 * Guess the muscle group from an exercise name.
 * Used when the exercise doesn't have explicit muscle group data.
 */
export function guessMuscleGroup(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('dip') || n.includes('push up')) return 'Chest'
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('calf') || n.includes('deadlift') || n.includes('hip') || n.includes('glute') || n.includes('hamstring')) return 'Legs'
  if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back') || n.includes('chin')) return 'Back'
  if (n.includes('shoulder') || n.includes('press') || n.includes('ohp') || n.includes('lateral') || n.includes('raise') || n.includes('delt') || n.includes('military')) return 'Shoulders'
  if (n.includes('curl') || n.includes('bicep') || n.includes('tricep') || n.includes('extension') || n.includes('skull') || n.includes('hammer') || n.includes('pushdown')) return 'Arms'
  if (n.includes('plank') || n.includes('crunch') || n.includes('ab') || n.includes('core')) return 'Core'
  return 'Chest'
}
