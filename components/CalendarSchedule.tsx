import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import {
  Users,
  CircleCheckBig,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { ScheduleItem } from '@/hooks/useStudyData';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const START_HOUR = 7;
const END_HOUR = 23;
const HOUR_HEIGHT = 52;
const HOUR_HEIGHT_WEEK = 36;
const LABEL_WIDTH = 56;
const TIMELINE_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const TIMELINE_HEIGHT_WEEK = (END_HOUR - START_HOUR) * HOUR_HEIGHT_WEEK;

function formatTime12hr(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatHourLabel(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12} ${period}`;
}

function timeToY(time: string, hourHeight: number): number {
  const [h, m] = time.split(':').map(Number);
  return Math.max(0, ((h * 60 + m - START_HOUR * 60) / 60) * hourHeight);
}

function blockHeight(start: string, end: string, hourHeight: number): number {
  return Math.max(22, timeToY(end, hourHeight) - timeToY(start, hourHeight));
}

function getWeekDates(weekOffset: number) {
  const now = new Date();
  const todayIdx = WEEKDAYS.indexOf(now.toLocaleDateString('en-US', { weekday: 'long' }));
  const monday = new Date(now);
  monday.setDate(now.getDate() - todayIdx + weekOffset * 7);
  return WEEKDAYS.map((day, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    return { day, dayNum: d.getDate(), isToday: idx === todayIdx && weekOffset === 0, month: d.getMonth() };
  });
}

function monthShort(m: number): string {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m];
}

export default function CalendarSchedule({ items, loading }: { items: ScheduleItem[]; loading: boolean }) {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [weekOffset, setWeekOffset] = useState(0);

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>();
    WEEKDAYS.forEach(d => map.set(d, []));
    items.forEach(item => {
      if (!map.has(item.day)) map.set(item.day, []);
      map.get(item.day)!.push(item);
    });
    return map;
  }, [items]);

  const todayItems = itemsByDay.get(todayName) ?? [];
  const todayAvailability = todayItems.filter(i => i.type === 'availability');
  const todayPods = todayItems.filter(i => i.type === 'pod-meeting');
  const todayTasks = todayItems.filter(i => i.type === 'task');

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nowYToday = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const showNowToday = nowYToday >= 0 && nowYToday <= TIMELINE_HEIGHT && weekOffset === 0;
  const nowYWeek = ((currentMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT_WEEK;
  const showNowWeek = nowYWeek >= 0 && nowYWeek <= TIMELINE_HEIGHT_WEEK && weekOffset === 0;

  const todayDateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const firstDate = weekDates[0];
  const lastDate = weekDates[6];
  const weekRangeStr = `${monthShort(firstDate.month)} ${firstDate.dayNum} \u2013 ${monthShort(lastDate.month)} ${lastDate.dayNum}`;

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.tabToggle}>
          <View style={[styles.tab, styles.tabActive]}><Text style={styles.tabTextActive}>Today</Text></View>
          <View style={styles.tab}><Text style={styles.tabText}>Week</Text></View>
        </View>
        <View style={[styles.skeleton, { height: 300, borderRadius: BorderRadius.lg }]} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Toggle */}
      <View style={styles.tabToggle}>
        <Pressable
          style={[styles.tab, viewMode === 'today' && styles.tabActive]}
          onPress={() => setViewMode('today')}
        >
          <Text style={[styles.tabText, viewMode === 'today' && styles.tabTextActive]}>Today</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, viewMode === 'week' && styles.tabActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.tabText, viewMode === 'week' && styles.tabTextActive]}>Week</Text>
        </Pressable>
      </View>

      {viewMode === 'today' ? (
        <View>
          <Text style={styles.dateHeader}>{todayDateStr}</Text>

          {/* Timeline */}
          <View style={styles.timelineContainer}>
            <View style={styles.hourGrid}>
              {hours.map(h => (
                <View key={h} style={styles.hourRow}>
                  <Text style={styles.hourLabel}>{formatHourLabel(h)}</Text>
                  <View style={styles.hourLine} />
                </View>
              ))}
            </View>
            <View style={styles.eventsOverlay}>
              {todayAvailability.map(item => (
                <View
                  key={item.id}
                  style={[
                    styles.eventBlock,
                    {
                      top: timeToY(item.startTime!, HOUR_HEIGHT),
                      height: blockHeight(item.startTime!, item.endTime!, HOUR_HEIGHT),
                    },
                  ]}
                >
                  <Text style={styles.eventTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.eventTime}>
                    {formatTime12hr(item.startTime!)} \u2013 {formatTime12hr(item.endTime!)}
                  </Text>
                </View>
              ))}
              {showNowToday && (
                <View style={[styles.nowLine, { top: nowYToday }]}>
                  <View style={styles.nowDot} />
                </View>
              )}
            </View>
          </View>

          {/* Classes & Pods */}
          {todayPods.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Classes & Pods</Text>
              <View style={styles.chipRow}>
                {todayPods.map(pod => (
                  <View key={pod.id} style={styles.podChip}>
                    <Users size={12} color={Colors.primary[700]} />
                    <Text style={styles.podChipText} numberOfLines={1}>{pod.title}</Text>
                    {pod.courseCode ? <Text style={styles.chipCode}>{pod.courseCode}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tasks */}
          {todayTasks.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Tasks</Text>
              <View style={styles.chipRow}>
                {todayTasks.map(task => (
                  <View key={task.id} style={styles.taskChip}>
                    <CircleCheckBig size={12} color={Colors.warning[600]} />
                    <Text style={styles.taskChipText} numberOfLines={1}>{task.title}</Text>
                    {task.courseCode ? <Text style={styles.chipCode}>{task.courseCode}</Text> : null}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Empty state */}
          {todayAvailability.length === 0 && todayPods.length === 0 && todayTasks.length === 0 && (
            <Text style={styles.emptyText}>Nothing scheduled for today. Enjoy the break or add a study task!</Text>
          )}
        </View>
      ) : (
        <View>
          {/* Week navigation */}
          <View style={styles.weekNav}>
            <Pressable onPress={() => setWeekOffset(w => w - 1)} hitSlop={8}>
              <ChevronLeft size={20} color={Colors.primary[500]} />
            </Pressable>
            <Text style={styles.weekRange}>
              {weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `+${weekOffset} Week${weekOffset > 1 ? 's' : ''}` : `${weekOffset} Week${weekOffset < -1 ? 's' : ''}`}
              {' \u00b7 '}
              {weekRangeStr}
            </Text>
            <Pressable onPress={() => setWeekOffset(w => w + 1)} hitSlop={8}>
              <ChevronRight size={20} color={Colors.primary[500]} />
            </Pressable>
          </View>

          {/* Day columns */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekScroll}>
            {weekDates.map(({ day, dayNum, isToday }) => {
              const dayItems = itemsByDay.get(day) ?? [];
              const dayAvailability = dayItems.filter(i => i.type === 'availability');
              const dayPods = dayItems.filter(i => i.type === 'pod-meeting');
              const dayTasks = dayItems.filter(i => i.type === 'task');
              return (
                <View key={day} style={[styles.dayColumn, isToday && styles.dayColumnToday]}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                      {day.substring(0, 3)}
                    </Text>
                    <View style={[styles.dayNumWrap, isToday && styles.dayNumWrapToday]}>
                      <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{dayNum}</Text>
                    </View>
                  </View>
                  <View style={styles.miniTimeline}>
                    {hours.map(h => (
                      <View key={h} style={styles.miniHourLine} />
                    ))}
                    {dayAvailability.map(item => (
                      <View
                        key={item.id}
                        style={[
                          styles.miniBlock,
                          {
                            top: timeToY(item.startTime!, HOUR_HEIGHT_WEEK),
                            height: blockHeight(item.startTime!, item.endTime!, HOUR_HEIGHT_WEEK),
                          },
                        ]}
                      />
                    ))}
                    {isToday && showNowWeek && (
                      <View style={[styles.miniNowLine, { top: nowYWeek }]} />
                    )}
                  </View>
                  <View style={styles.dayChips}>
                    {dayPods.map(p => (
                      <View key={p.id} style={styles.miniPodChip}>
                        <Users size={10} color={Colors.primary[700]} />
                      </View>
                    ))}
                    {dayTasks.length > 0 && (
                      <View style={styles.miniTaskChip}>
                        <Text style={styles.miniTaskCount}>{dayTasks.length}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  skeleton: {
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    opacity: 0.5,
  },

  /* Tab toggle */
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[500],
  },
  tabTextActive: {
    color: Colors.primary[700],
    fontFamily: 'Inter-SemiBold',
  },

  /* Today view */
  dateHeader: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  timelineContainer: {
    position: 'relative',
    height: TIMELINE_HEIGHT,
  },
  hourGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hourRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLabel: {
    width: LABEL_WIDTH,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.neutral[400],
    marginTop: -7,
    textAlign: 'right',
    paddingRight: Spacing.sm,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.neutral[200],
    marginTop: 0,
  },
  eventsOverlay: {
    position: 'absolute',
    left: LABEL_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
  },
  eventBlock: {
    position: 'absolute',
    left: 4,
    right: 4,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  eventTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[0],
  },
  eventTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.error[500],
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error[500],
    marginLeft: -4,
  },

  /* Sections */
  sectionBlock: {
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  podChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    maxWidth: 200,
  },
  podChipText: {
    ...Typography.small,
    color: Colors.primary[700],
    fontFamily: 'Inter-Medium',
  },
  taskChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    maxWidth: 200,
  },
  taskChipText: {
    ...Typography.small,
    color: Colors.warning[600],
    fontFamily: 'Inter-Medium',
  },
  chipCode: {
    ...Typography.small,
    color: Colors.neutral[500],
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.neutral[400],
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  /* Week view */
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  weekRange: {
    ...Typography.bodyMedium,
    color: Colors.ink,
  },
  weekScroll: {
    paddingRight: Spacing.lg,
  },
  dayColumn: {
    width: 80,
    marginRight: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    overflow: 'hidden',
  },
  dayColumnToday: {
    borderColor: Colors.primary[300],
    borderWidth: 2,
  },
  dayHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
  },
  dayName: {
    ...Typography.small,
    color: Colors.neutral[500],
    fontFamily: 'Inter-Medium',
  },
  dayNameToday: {
    color: Colors.primary[600],
    fontFamily: 'Inter-SemiBold',
  },
  dayNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dayNumWrapToday: {
    backgroundColor: Colors.primary[500],
  },
  dayNum: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.ink,
  },
  dayNumToday: {
    color: Colors.neutral[0],
  },
  miniTimeline: {
    position: 'relative',
    height: TIMELINE_HEIGHT_WEEK,
  },
  miniHourLine: {
    height: HOUR_HEIGHT_WEEK,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[100],
  },
  miniBlock: {
    position: 'absolute',
    left: 3,
    right: 3,
    backgroundColor: Colors.primary[400],
    borderRadius: 4,
    opacity: 0.85,
  },
  miniNowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.error[500],
  },
  dayChips: {
    flexDirection: 'row',
    gap: 4,
    padding: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
    minHeight: 36,
    flexWrap: 'wrap',
  },
  miniPodChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTaskChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.warning[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTaskCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.warning[600],
  },
});
