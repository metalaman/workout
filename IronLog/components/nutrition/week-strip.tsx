import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '@/constants/theme'
import type { FoodLogEntry } from '@/types/nutrition'
import { getWeekDates, getDateString } from '@/lib/nutrition-utils'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const MONTH_DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

interface WeekStripProps {
  weekOffset?: number
  weekLogs: Record<string, FoodLogEntry[]>
  calorieTarget: number
  selectedDate: string
  onSelectDate: (date: string) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onJumpToDate?: (date: string) => void
}

export const WeekStrip = React.memo(function WeekStrip({
  weekOffset = 0,
  weekLogs,
  calorieTarget,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onJumpToDate,
}: WeekStripProps) {
  const dates = getWeekDates(weekOffset)
  const today = getDateString()
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const handleCalendarSelect = (dateStr: string) => {
    setShowCalendar(false)
    if (onJumpToDate) {
      onJumpToDate(dateStr)
    } else {
      onSelectDate(dateStr)
    }
  }

  const calendarCells = buildMonthCalendar(calendarMonth.year, calendarMonth.month)
  const monthName = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  })

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevWeek} style={styles.navButton} activeOpacity={0.6}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowCalendar(true)}
          style={styles.weekLabelRow}
          activeOpacity={0.7}
        >
          <Text style={styles.weekLabel}>
            {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : formatWeekRange(dates)}
          </Text>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke={Colors.dark.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNextWeek}
          style={[styles.navButton, weekOffset >= 0 && styles.navDisabled]}
          activeOpacity={0.6}
          disabled={weekOffset >= 0}
        >
          <Text style={[styles.navText, weekOffset >= 0 && styles.navTextDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.calendarSheet} onPress={() => {}}>
            {/* Month nav */}
            <View style={styles.calMonthNav}>
              <TouchableOpacity
                onPress={() => setCalendarMonth((m) => {
                  const d = new Date(m.year, m.month - 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })}
                activeOpacity={0.6}
                hitSlop={12}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M15 18l-6-6 6-6" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>{monthName}</Text>
              <TouchableOpacity
                onPress={() => setCalendarMonth((m) => {
                  const d = new Date(m.year, m.month + 1)
                  return { year: d.getFullYear(), month: d.getMonth() }
                })}
                activeOpacity={0.6}
                hitSlop={12}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke={Colors.dark.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            </View>
            {/* Day labels */}
            <View style={styles.calDayLabels}>
              {MONTH_DAY_LABELS.map((l, i) => (
                <Text key={i} style={styles.calDayLabel}>{l}</Text>
              ))}
            </View>
            {/* Calendar grid */}
            <View style={styles.calGrid}>
              {calendarCells.map((cell, i) => {
                const isSelected = cell.dateStr === selectedDate
                const isCellToday = cell.dateStr === today
                const isFuture = cell.dateStr > today
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.calCell}
                    onPress={() => cell.inMonth && !isFuture ? handleCalendarSelect(cell.dateStr) : null}
                    activeOpacity={cell.inMonth && !isFuture ? 0.6 : 1}
                    disabled={!cell.inMonth || isFuture}
                  >
                    {cell.inMonth && (
                      <View style={[
                        styles.calCellInner,
                        isSelected && { backgroundColor: Colors.dark.accent },
                        isCellToday && !isSelected && { borderWidth: 1.5, borderColor: Colors.dark.accent },
                      ]}>
                        <Text style={[
                          styles.calCellText,
                          isSelected && { color: Colors.dark.textOnAccent, fontWeight: FontWeight.bold },
                          isCellToday && !isSelected && { color: Colors.dark.accent },
                          isFuture && { color: Colors.dark.textDark },
                        ]}>
                          {cell.day}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              })}
            </View>
            {/* Today button */}
            <TouchableOpacity
              style={styles.calTodayBtn}
              onPress={() => {
                const todayDate = new Date()
                setCalendarMonth({ year: todayDate.getFullYear(), month: todayDate.getMonth() })
                handleCalendarSelect(today)
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.calTodayText}>Jump to Today</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.daysRow}>
        {dates.map((date, idx) => {
          const isSelected = date === selectedDate
          const isToday = date === today
          const isFuture = date > today
          const logs = weekLogs[date] ?? []
          const totalCal = logs.reduce((sum, l) => sum + l.calories, 0)
          const hasData = logs.length > 0
          const isOver = hasData && totalCal > calorieTarget

          return (
            <TouchableOpacity
              key={date}
              style={[styles.dayCell, isSelected && styles.dayCellSelected]}
              onPress={() => onSelectDate(date)}
              activeOpacity={0.7}
              disabled={isFuture}
            >
              <Text style={[styles.dayLabel, isFuture && styles.dayLabelFuture]}>
                {DAY_LABELS[idx]}
              </Text>
              <Text style={[
                styles.dayNumber,
                isToday && styles.dayNumberToday,
                isFuture && styles.dayLabelFuture,
              ]}>
                {parseInt(date.split('-')[2], 10)}
              </Text>
              <DayRing
                hasData={hasData}
                isOver={isOver}
                isFuture={isFuture}
              />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
})

function DayRing({ hasData, isOver, isFuture }: { hasData: boolean; isOver: boolean; isFuture: boolean }) {
  const ringSize = 14
  const strokeW = 2
  const r = (ringSize - strokeW) / 2

  let color = Colors.dark.textDark
  if (hasData && !isFuture) {
    color = isOver ? Colors.dark.danger : Colors.dark.accentGreen
  }

  return (
    <View style={styles.ringContainer}>
      <Svg width={ringSize} height={ringSize}>
        <Circle
          cx={ringSize / 2}
          cy={ringSize / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeW}
          fill={hasData && !isFuture ? color : 'none'}
          opacity={hasData ? 1 : 0.3}
        />
      </Svg>
    </View>
  )
}

function formatWeekRange(dates: string[]): string {
  const start = new Date(dates[0] + 'T00:00:00')
  const end = new Date(dates[6] + 'T00:00:00')
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

interface CalendarCell {
  day: number
  dateStr: string
  inMonth: boolean
}

function buildMonthCalendar(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: CalendarCell[] = []

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: 0, dateStr: '', inMonth: false })
  }

  // Days in month
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    cells.push({ day: d, dateStr: `${year}-${m}-${dd}`, inMonth: true })
  }

  // Pad to fill last row
  while (cells.length % 7 !== 0) {
    cells.push({ day: 0, dateStr: '', inMonth: false })
  }

  return cells
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  navButton: {
    padding: Spacing.xs,
  },
  navDisabled: {
    opacity: 0.3,
  },
  navText: {
    color: Colors.dark.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
  },
  navTextDisabled: {
    color: Colors.dark.textMuted,
  },
  weekLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weekLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
  },
  // ─── Calendar Modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarSheet: {
    backgroundColor: Colors.dark.cardLight,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xxl,
    width: '85%',
    maxWidth: 360,
  },
  calMonthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  calMonthTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  calDayLabels: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  calDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textMuted,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: '14.28%' as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  calCellInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calCellText: {
    fontSize: FontSize.base,
    color: Colors.dark.textSecondary,
  },
  calTodayBtn: {
    alignSelf: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.accent + '30',
  },
  calTodayText: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.accent,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  dayCellSelected: {
    backgroundColor: Colors.dark.accentSurface,
  },
  dayLabel: {
    color: Colors.dark.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    marginBottom: 4,
  },
  dayLabelFuture: {
    color: Colors.dark.textDark,
  },
  dayNumber: {
    color: Colors.dark.text,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold,
    marginBottom: 4,
  },
  dayNumberToday: {
    color: Colors.dark.accent,
  },
  ringContainer: {
    marginTop: 2,
  },
})
