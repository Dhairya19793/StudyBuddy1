import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Calendar, Check, Clock, X } from 'lucide-react-native';
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AvailabilityBlock {
  day: string; // 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  startTime: string; // '08:00', '08:30', …
  endTime: string; // '08:30', '09:00', …
}

interface AvailabilityPickerProps {
  selectedBlocks: AvailabilityBlock[];
  onBlocksChange: (blocks: AvailabilityBlock[]) => void;
  isFlexible: boolean;
  onFlexibleChange: (flexible: boolean) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAYS: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FULL_DAY_NAMES: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const BREAKPOINT = 768;
const CELL_HEIGHT = 44;
const MOBILE_ROW_HEIGHT = 48;

/** Generate every 30-minute slot from 08:00 to 23:00 (last slot = 22:30→23:00). */
function generateTimeSlots(): { startTime: string; endTime: string }[] {
  const slots: { startTime: string; endTime: string }[] = [];
  for (let hour = 8; hour < 23; hour++) {
    for (const min of [0, 30]) {
      const start = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      const endMin = min === 30 ? 0 : 30;
      const endHour = min === 30 ? hour + 1 : hour;
      const end = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      slots.push({ startTime: start, endTime: end });
    }
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

// ---------------------------------------------------------------------------
// Helpers (exported)
// ---------------------------------------------------------------------------

/** Format 24-h time string to 12-h display, e.g. "08:00" → "8 AM", "13:30" → "1:30 PM". */
function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  let hour = parseInt(hStr, 10);
  const min = parseInt(mStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return min === 0 ? `${hour} ${ampm}` : `${hour}:${String(min).padStart(2, '0')} ${ampm}`;
}

/** Convert "HH:MM" to minutes since midnight for comparisons. */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Produce a human-readable summary such as
 * "Wednesday 6–7:30 PM, Thursday 5–8 PM".
 */
export function getAvailabilitySummary(blocks: AvailabilityBlock[]): string {
  if (blocks.length === 0) return '';

  // Group blocks by day (preserve day order).
  const byDay = new Map<string, AvailabilityBlock[]>();
  for (const day of DAYS) {
    const dayBlocks = blocks
      .filter((b) => b.day === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    if (dayBlocks.length > 0) byDay.set(day, dayBlocks);
  }

  const parts: string[] = [];

  byDay.forEach((dayBlocks, day) => {
    // Merge consecutive blocks into ranges.
    const ranges: { start: string; end: string }[] = [];
    let currentStart = dayBlocks[0].startTime;
    let currentEnd = dayBlocks[0].endTime;

    for (let i = 1; i < dayBlocks.length; i++) {
      if (dayBlocks[i].startTime === currentEnd) {
        currentEnd = dayBlocks[i].endTime;
      } else {
        ranges.push({ start: currentStart, end: currentEnd });
        currentStart = dayBlocks[i].startTime;
        currentEnd = dayBlocks[i].endTime;
      }
    }
    ranges.push({ start: currentStart, end: currentEnd });

    const rangeStrs = ranges.map((r) => `${formatTime(r.start)}–${formatTime(r.end)}`);
    parts.push(`${FULL_DAY_NAMES[day]} ${rangeStrs.join(', ')}`);
  });

  return parts.join(', ');
}

/**
 * True when the user has provided enough availability:
 * either "flexible" is on, or at least 2 blocks (= 1 hour).
 */
export function isMinimumAvailability(
  blocks: AvailabilityBlock[],
  isFlexible: boolean,
): boolean {
  return isFlexible || blocks.length >= 2;
}

// ---------------------------------------------------------------------------
// Block-set helpers
// ---------------------------------------------------------------------------

function blockKey(day: string, startTime: string): string {
  return `${day}::${startTime}`;
}

function isBlockSelected(
  selected: AvailabilityBlock[],
  day: string,
  startTime: string,
): boolean {
  return selected.some((b) => b.day === day && b.startTime === startTime);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AvailabilityPicker({
  selectedBlocks,
  onBlocksChange,
  isFlexible,
  onFlexibleChange,
}: AvailabilityPickerProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width > BREAKPOINT;

  // Mobile: track which day tab is active.
  const [activeDay, setActiveDay] = useState<string>('Mon');

  // Desktop drag-to-select state.
  const isDragging = useRef(false);
  const dragMode = useRef<'select' | 'deselect'>('select');
  const draggedKeys = useRef(new Set<string>());

  // ------------------------------------------------------------------
  // Toggle helpers
  // ------------------------------------------------------------------

  const toggleBlock = useCallback(
    (day: string, startTime: string, endTime: string) => {
      const exists = isBlockSelected(selectedBlocks, day, startTime);
      if (exists) {
        onBlocksChange(
          selectedBlocks.filter((b) => !(b.day === day && b.startTime === startTime)),
        );
      } else {
        onBlocksChange([...selectedBlocks, { day, startTime, endTime }]);
      }
    },
    [selectedBlocks, onBlocksChange],
  );

  const addBlock = useCallback(
    (day: string, startTime: string, endTime: string) => {
      if (!isBlockSelected(selectedBlocks, day, startTime)) {
        onBlocksChange([...selectedBlocks, { day, startTime, endTime }]);
      }
    },
    [selectedBlocks, onBlocksChange],
  );

  const removeBlock = useCallback(
    (day: string, startTime: string) => {
      onBlocksChange(
        selectedBlocks.filter((b) => !(b.day === day && b.startTime === startTime)),
      );
    },
    [selectedBlocks, onBlocksChange],
  );

  const clearAll = useCallback(() => {
    onBlocksChange([]);
  }, [onBlocksChange]);

  // ------------------------------------------------------------------
  // Desktop drag handlers (web only)
  // ------------------------------------------------------------------

  const handleCellPointerDown = useCallback(
    (day: string, startTime: string, endTime: string) => {
      if (!isDesktop || Platform.OS !== 'web') return;
      const selected = isBlockSelected(selectedBlocks, day, startTime);
      isDragging.current = true;
      dragMode.current = selected ? 'deselect' : 'select';
      draggedKeys.current = new Set([blockKey(day, startTime)]);

      if (selected) {
        removeBlock(day, startTime);
      } else {
        addBlock(day, startTime, endTime);
      }
    },
    [isDesktop, selectedBlocks, addBlock, removeBlock],
  );

  const handleCellPointerEnter = useCallback(
    (day: string, startTime: string, endTime: string) => {
      if (!isDragging.current) return;
      const key = blockKey(day, startTime);
      if (draggedKeys.current.has(key)) return;
      draggedKeys.current.add(key);

      if (dragMode.current === 'select') {
        addBlock(day, startTime, endTime);
      } else {
        removeBlock(day, startTime);
      }
    },
    [addBlock, removeBlock],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    draggedKeys.current.clear();
  }, []);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------

  const summary = useMemo(
    () => getAvailabilitySummary(selectedBlocks),
    [selectedBlocks],
  );

  // ------------------------------------------------------------------
  // Hour labels for the left gutter (only show on the hour, not :30).
  // ------------------------------------------------------------------

  const hourLabel = useCallback((startTime: string): string | null => {
    const [, m] = startTime.split(':');
    if (m !== '00') return null;
    return formatTime(startTime);
  }, []);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <View style={styles.container}>
      {/* ---- Header row ---- */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Calendar size={18} color={Colors.primary[500]} />
          <Text style={styles.headerTitle}>Availability</Text>
        </View>

        {selectedBlocks.length > 0 && !isFlexible && (
          <Pressable
            onPress={clearAll}
            style={styles.clearButton}
            accessibilityLabel="Clear all selections"
          >
            <X size={14} color={Colors.error[500]} />
            <Text style={styles.clearButtonText}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {/* ---- Flexible toggle ---- */}
      <View style={styles.flexibleRow}>
        <View style={styles.flexibleLabel}>
          <Check
            size={16}
            color={isFlexible ? Colors.primary[500] : Colors.neutral[400]}
          />
          <Text style={styles.flexibleText}>I'm flexible</Text>
        </View>
        <Switch
          value={isFlexible}
          onValueChange={onFlexibleChange}
          trackColor={{
            false: Colors.neutral[200],
            true: Colors.primary[200],
          }}
          thumbColor={isFlexible ? Colors.primary[500] : Colors.neutral[0]}
        />
      </View>

      {isFlexible ? (
        <View style={styles.flexibleMessage}>
          <Clock size={18} color={Colors.secondary[500]} />
          <Text style={styles.flexibleMessageText}>
            Available anytime — flexible schedule
          </Text>
        </View>
      ) : (
        <>
          {/* ---- Grid / List ---- */}
          {isDesktop ? (
            <DesktopGrid
              selectedBlocks={selectedBlocks}
              onCellPointerDown={handleCellPointerDown}
              onCellPointerEnter={handleCellPointerEnter}
              onPointerUp={handlePointerUp}
              hourLabel={hourLabel}
            />
          ) : (
            <MobileList
              selectedBlocks={selectedBlocks}
              activeDay={activeDay}
              onActiveDayChange={setActiveDay}
              onToggle={toggleBlock}
              hourLabel={hourLabel}
            />
          )}

          {/* ---- Summary / Helper ---- */}
          <View style={styles.summaryContainer}>
            {selectedBlocks.length > 0 ? (
              <Text style={styles.summaryText}>{summary}</Text>
            ) : (
              <Text style={styles.helperText}>
                Tap time blocks to mark when you're available
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Desktop Grid
// ---------------------------------------------------------------------------

interface DesktopGridProps {
  selectedBlocks: AvailabilityBlock[];
  onCellPointerDown: (day: string, start: string, end: string) => void;
  onCellPointerEnter: (day: string, start: string, end: string) => void;
  onPointerUp: () => void;
  hourLabel: (start: string) => string | null;
}

function DesktopGrid({
  selectedBlocks,
  onCellPointerDown,
  onCellPointerEnter,
  onPointerUp,
  hourLabel,
}: DesktopGridProps) {
  // Attach global pointerup so drag ends even if the pointer leaves the grid.
  const containerRef = useRef<View>(null);

  // We use web-specific event props via style prop trick:
  // React Native for Web translates onPointerUp on <View> elements.

  return (
    <View
      ref={containerRef}
      style={styles.desktopGrid}
      // @ts-ignore – web-only prop
      onPointerUp={onPointerUp}
      // @ts-ignore
      onPointerLeave={onPointerUp}
    >
      {/* Column headers */}
      <View style={styles.gridRow}>
        <View style={styles.timeGutter} />
        {DAYS.map((day) => (
          <View key={day} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable body */}
      <ScrollView
        style={styles.gridScrollView}
        contentContainerStyle={styles.gridScrollContent}
        showsVerticalScrollIndicator
      >
        {TIME_SLOTS.map((slot) => {
          const label = hourLabel(slot.startTime);
          const isHour = label !== null;

          return (
            <View
              key={slot.startTime}
              style={[styles.gridRow, isHour && styles.gridRowHourBorder]}
            >
              {/* Time gutter */}
              <View style={styles.timeGutter}>
                {isHour && (
                  <Text style={styles.timeGutterText}>{label}</Text>
                )}
              </View>

              {/* Day cells */}
              {DAYS.map((day) => {
                const selected = isBlockSelected(
                  selectedBlocks,
                  day,
                  slot.startTime,
                );
                return (
                  <Pressable
                    key={`${day}-${slot.startTime}`}
                    style={[
                      styles.gridCell,
                      selected && styles.gridCellSelected,
                      isHour && styles.gridCellHourBorder,
                    ]}
                    // @ts-ignore – web pointer events
                    onPointerDown={() =>
                      onCellPointerDown(day, slot.startTime, slot.endTime)
                    }
                    // @ts-ignore
                    onPointerEnter={() =>
                      onCellPointerEnter(day, slot.startTime, slot.endTime)
                    }
                    accessibilityLabel={`${day} ${slot.startTime} to ${slot.endTime}${selected ? ', selected' : ''}`}
                    accessibilityRole="checkbox"
                  >
                    {selected && (
                      <View style={styles.gridCellDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mobile List
// ---------------------------------------------------------------------------

interface MobileListProps {
  selectedBlocks: AvailabilityBlock[];
  activeDay: string;
  onActiveDayChange: (day: string) => void;
  onToggle: (day: string, start: string, end: string) => void;
  hourLabel: (start: string) => string | null;
}

function MobileList({
  selectedBlocks,
  activeDay,
  onActiveDayChange,
  onToggle,
  hourLabel,
}: MobileListProps) {
  /** Count selected blocks for a given day (used for badge). */
  const countForDay = useCallback(
    (day: string) => selectedBlocks.filter((b) => b.day === day).length,
    [selectedBlocks],
  );

  return (
    <View style={styles.mobileContainer}>
      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mobileDayTabs}
      >
        {DAYS.map((day) => {
          const isActive = day === activeDay;
          const count = countForDay(day);
          return (
            <Pressable
              key={day}
              onPress={() => onActiveDayChange(day)}
              style={[
                styles.mobileDayTab,
                isActive && styles.mobileDayTabActive,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.mobileDayTabText,
                  isActive && styles.mobileDayTabTextActive,
                ]}
              >
                {day}
              </Text>
              {count > 0 && (
                <View style={styles.mobileDayBadge}>
                  <Text style={styles.mobileDayBadgeText}>{count}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Time rows for selected day */}
      <ScrollView
        style={styles.mobileTimeList}
        contentContainerStyle={styles.mobileTimeListContent}
        showsVerticalScrollIndicator
      >
        {TIME_SLOTS.map((slot) => {
          const selected = isBlockSelected(
            selectedBlocks,
            activeDay,
            slot.startTime,
          );
          const label = hourLabel(slot.startTime);
          const isHour = label !== null;

          return (
            <Pressable
              key={slot.startTime}
              onPress={() => onToggle(activeDay, slot.startTime, slot.endTime)}
              style={[
                styles.mobileTimeRow,
                selected && styles.mobileTimeRowSelected,
                isHour && styles.mobileTimeRowHourBorder,
              ]}
              accessibilityLabel={`${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}${selected ? ', selected' : ''}`}
              accessibilityRole="checkbox"
            >
              <Text
                style={[
                  styles.mobileTimeText,
                  selected && styles.mobileTimeTextSelected,
                ]}
              >
                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
              </Text>
              {selected && (
                <View style={styles.mobileCheckCircle}>
                  <Check size={14} color={Colors.neutral[0]} />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Container
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.neutral[900],
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error[50],
  },
  clearButtonText: {
    ...Typography.captionMedium,
    color: Colors.error[500],
  },

  // Flexible toggle
  flexibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral[50],
    marginBottom: Spacing.md,
  },
  flexibleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  flexibleText: {
    ...Typography.bodyMedium,
    color: Colors.neutral[800],
  },
  flexibleMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary[50],
  },
  flexibleMessageText: {
    ...Typography.bodyMedium,
    color: Colors.secondary[700],
  },

  // Summary / helper
  summaryContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  summaryText: {
    ...Typography.caption,
    color: Colors.neutral[600],
  },
  helperText: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: 'center',
  },

  // ---- Desktop Grid ----
  desktopGrid: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  gridScrollView: {
    maxHeight: CELL_HEIGHT * 16, // show ~8 hours at a time
  },
  gridScrollContent: {
    // no extra padding needed
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  gridRowHourBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },

  // Time gutter
  timeGutter: {
    width: 60,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: Spacing.sm,
    paddingTop: 2,
  },
  timeGutterText: {
    ...Typography.small,
    color: Colors.neutral[500],
  },

  // Day headers
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  dayHeaderText: {
    ...Typography.label,
    color: Colors.neutral[700],
    textTransform: 'uppercase',
  },

  // Grid cells
  gridCell: {
    flex: 1,
    height: CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[0],
    // Web: smooth transition via CSS (RN ignores unknown props on native)
    ...(Platform.OS === 'web'
      ? ({ transitionProperty: 'background-color', transitionDuration: '0.15s' } as any)
      : {}),
  },
  gridCellSelected: {
    backgroundColor: Colors.primary[500],
  },
  gridCellHourBorder: {
    borderTopWidth: 0, // the row already has it
  },
  gridCellDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },

  // ---- Mobile ----
  mobileContainer: {
    gap: Spacing.sm,
  },
  mobileDayTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  mobileDayTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
  },
  mobileDayTabActive: {
    backgroundColor: Colors.primary[500],
  },
  mobileDayTabText: {
    ...Typography.captionMedium,
    color: Colors.neutral[700],
  },
  mobileDayTabTextActive: {
    color: Colors.neutral[0],
  },
  mobileDayBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.secondary[500],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  mobileDayBadgeText: {
    ...Typography.small,
    color: Colors.neutral[0],
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    lineHeight: 14,
  },

  // Time list (mobile)
  mobileTimeList: {
    maxHeight: MOBILE_ROW_HEIGHT * 10, // show ~10 rows before scrolling
  },
  mobileTimeListContent: {
    gap: Spacing.xs,
  },
  mobileTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: MOBILE_ROW_HEIGHT,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.neutral[0],
  },
  mobileTimeRowSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[600],
  },
  mobileTimeRowHourBorder: {
    marginTop: Spacing.xs,
  },
  mobileTimeText: {
    ...Typography.bodyMedium,
    color: Colors.neutral[800],
  },
  mobileTimeTextSelected: {
    color: Colors.neutral[0],
  },
  mobileCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
