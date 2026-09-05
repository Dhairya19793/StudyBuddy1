import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  Plus,
  X,
  Send,
  Filter,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { SOLO_TASKS, COURSES } from '@/constants/mockData';
import type { SoloTask } from '@/constants/mockData';

/* ─── types ─────────────────────────────────────────────────── */

type FilterKey = 'all' | 'active' | 'stuck' | 'completed';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'stuck', label: 'Stuck' },
  { key: 'completed', label: 'Completed' },
];

const COURSE_OPTIONS = [
  { code: null as string | null, label: 'No course' },
  ...COURSES.map((c) => ({ code: c.code, label: c.code })),
];

/* ─── toast component ───────────────────────────────────────── */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Send size={14} color={Colors.neutral[0]} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

/* ─── main component ────────────────────────────────────────── */

export default function WorkspaceScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  /* ── state ── */
  const [tasks, setTasks] = useState<SoloTask[]>(SOLO_TASKS);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCourseIdx, setSelectedCourseIdx] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);

  /* ── derived stats ── */
  const completedCount = tasks.filter((t) => t.completed).length;
  const stuckCount = tasks.filter((t) => t.isStuck && !t.completed).length;
  const remainingCount = tasks.filter((t) => !t.completed).length;

  /* ── filtered + sorted list ── */
  const filteredTasks = tasks.filter((t) => {
    switch (activeFilter) {
      case 'active':
        return !t.completed && !t.isStuck;
      case 'stuck':
        return t.isStuck && !t.completed;
      case 'completed':
        return t.completed;
      default:
        return true;
    }
  });

  // Sort: active first, then stuck, then completed
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const order = (t: SoloTask) => {
      if (t.completed) return 2;
      if (t.isStuck) return 1;
      return 0;
    };
    return order(a) - order(b);
  });

  /* ── handlers ── */
  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, isStuck: !t.completed ? false : t.isStuck }
          : t
      )
    );
  }, []);

  const toggleStuck = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, isStuck: !t.isStuck } : t
      )
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addTask = useCallback(() => {
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const course = COURSE_OPTIONS[selectedCourseIdx];
    const newTask: SoloTask = {
      id: `st_${Date.now()}`,
      text: trimmed,
      courseCode: course.code ?? undefined,
      completed: false,
      isStuck: false,
      createdAt: 'Just now',
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
  }, [newTaskText, selectedCourseIdx]);

  const createRequest = useCallback(() => {
    setToastKey((k) => k + 1);
    setToastVisible(true);
    // Reset after animation completes
    const timer = setTimeout(() => setToastVisible(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  const cycleCourse = useCallback(() => {
    setSelectedCourseIdx((prev) => (prev + 1) % COURSE_OPTIONS.length);
  }, []);

  /* ── find course color ── */
  const getCourseColor = (code: string) => {
    const course = COURSES.find((c) => c.code === code);
    return course?.color ?? Colors.primary[500];
  };

  /* ── render task item ── */
  const renderTask = useCallback(
    ({ item }: { item: SoloTask }) => {
      const isCompleted = item.completed;
      const isStuck = item.isStuck && !item.completed;

      return (
        <View style={[styles.taskCard, isWide && styles.taskCardWide]}>
          {/* Left: checkbox */}
          <TouchableOpacity
            onPress={() => toggleComplete(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.checkboxTouch}
          >
            {isCompleted ? (
              <CheckCircle size={24} color={Colors.primary[500]} fill={Colors.primary[100]} />
            ) : (
              <Circle size={24} color={Colors.neutral[300]} />
            )}
          </TouchableOpacity>

          {/* Middle: task info */}
          <View style={styles.taskContent}>
            <View style={styles.taskTextRow}>
              <Text
                style={[
                  styles.taskText,
                  isCompleted && styles.taskTextCompleted,
                ]}
                numberOfLines={2}
              >
                {item.text}
              </Text>
            </View>

            <View style={styles.taskBadgesRow}>
              {item.courseCode && (
                <View
                  style={[
                    styles.courseBadge,
                    { backgroundColor: getCourseColor(item.courseCode) + '18' },
                  ]}
                >
                  <Text
                    style={[
                      styles.courseBadgeText,
                      { color: getCourseColor(item.courseCode) },
                    ]}
                  >
                    {item.courseCode}
                  </Text>
                </View>
              )}
              {isStuck && (
                <View style={styles.stuckBadge}>
                  <AlertTriangle size={12} color={Colors.warning[600]} />
                  <Text style={styles.stuckBadgeText}>Stuck</Text>
                </View>
              )}
            </View>
          </View>

          {/* Right: action buttons */}
          <View style={styles.taskActions}>
            {isStuck && (
              <TouchableOpacity
                onPress={createRequest}
                style={styles.createRequestBtn}
                activeOpacity={0.7}
              >
                <Send size={11} color={Colors.neutral[0]} />
                <Text style={styles.createRequestText}>Create Request</Text>
              </TouchableOpacity>
            )}
            {!isCompleted && (
              <TouchableOpacity
                onPress={() => toggleStuck(item.id)}
                style={[
                  styles.stuckToggleBtn,
                  isStuck && styles.stuckToggleBtnActive,
                ]}
                activeOpacity={0.7}
              >
                <AlertTriangle
                  size={12}
                  color={isStuck ? Colors.warning[600] : Colors.neutral[400]}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => deleteTask(item.id)}
              style={styles.deleteBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <X size={16} color={Colors.neutral[400]} />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [isWide, toggleComplete, toggleStuck, deleteTask, createRequest]
  );

  const keyExtractor = useCallback((item: SoloTask) => item.id, []);

  /* ── header component for FlatList ── */
  const ListHeader = (
    <>
      {/* ── HEADER ───────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Solo Workspace</Text>
        <Text style={styles.subtitle}>Your private study checklist</Text>
      </View>

      {/* ── STATS ROW ────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={[styles.statBadge, { backgroundColor: Colors.primary[50] }]}>
          <Text style={[styles.statValue, { color: Colors.primary[600] }]}>
            {completedCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.primary[500] }]}>
            completed
          </Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: Colors.neutral[100] }]}>
          <Text style={[styles.statValue, { color: Colors.neutral[700] }]}>
            {remainingCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.neutral[500] }]}>
            remaining
          </Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: Colors.warning[50] }]}>
          <Text style={[styles.statValue, { color: Colors.warning[600] }]}>
            {stuckCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.warning[500] }]}>
            stuck
          </Text>
        </View>
      </View>

      {/* ── FILTER CHIPS ─────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        <Filter size={16} color={Colors.neutral[400]} style={{ marginRight: Spacing.sm }} />
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── ADD TASK ROW ─────────────────────────────── */}
      <View style={styles.addRow}>
        <View style={styles.addInputWrap}>
          <TextInput
            style={styles.addInput}
            placeholder="Add a new task…"
            placeholderTextColor={Colors.neutral[400]}
            value={newTaskText}
            onChangeText={setNewTaskText}
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity
          onPress={cycleCourse}
          style={styles.courseSelectorBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.courseSelectorText} numberOfLines={1}>
            {COURSE_OPTIONS[selectedCourseIdx].label}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={addTask}
          style={[
            styles.addBtn,
            !newTaskText.trim() && styles.addBtnDisabled,
          ]}
          activeOpacity={0.8}
          disabled={!newTaskText.trim()}
        >
          <Plus size={20} color={Colors.neutral[0]} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </>
  );

  /* ── empty state ── */
  const ListEmpty = (
    <View style={styles.emptyState}>
      <Circle size={40} color={Colors.neutral[300]} />
      <Text style={styles.emptyTitle}>No tasks here</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === 'all'
          ? 'Add a task above to get started'
          : `No ${activeFilter} tasks right now`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.container, isWide && styles.containerWide]}>
        <FlatList
          data={sortedTasks}
          renderItem={renderTask}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* Toast notification */}
      <Toast
        key={toastKey}
        message="Study Request created!"
        visible={toastVisible}
      />
    </SafeAreaView>
  );
}

/* ─── styles ────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* layout */
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  containerWide: {
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 120,
  },

  /* header */
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: Colors.primary[500],
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  /* stats row */
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  statValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    lineHeight: 22,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },

  /* filter chips */
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.neutral[600],
  },
  filterChipTextActive: {
    color: Colors.neutral[0],
  },

  /* add task row */
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  addInputWrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  addInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.neutral[900],
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm,
    lineHeight: 22,
  },
  courseSelectorBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  courseSelectorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[600],
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  addBtnDisabled: {
    backgroundColor: Colors.neutral[300],
  },

  /* task card */
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  taskCardWide: {
    padding: Spacing.lg,
  },
  checkboxTouch: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  taskTextRow: {
    marginBottom: Spacing.xs,
  },
  taskText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.neutral[900],
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[400],
  },
  taskBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  courseBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  courseBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  stuckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  stuckBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.warning[600],
    letterSpacing: 0.3,
  },

  /* task actions */
  taskActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  createRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  createRequestText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.neutral[0],
  },
  stuckToggleBtn: {
    width: 30,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stuckToggleBtnActive: {
    backgroundColor: Colors.warning[100],
  },
  deleteBtn: {
    width: 30,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* empty state */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: Colors.neutral[600],
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[400],
    textAlign: 'center',
  },

  /* toast */
  toast: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 80 : 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
  },
  toastText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[0],
  },
});
