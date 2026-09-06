import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  Plus,
  X,
  Send,
  Clock,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  SkipForward,
  BookOpen,
  FileText,
  Trash2,
  ArrowLeft,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { SoloTask, StudyPlan } from '@/constants/mockData';
import { useCourses, useSoloTasks, useStudyPlans } from '@/hooks/useStudyData';

const FOREST = '#2F6B45';
const GOLD = '#D4A72C';
const OFF_WHITE = '#F8F6F0';

type Screen = 'plans' | 'detail' | 'focus';

export default function WorkspaceScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const router = useRouter();

  const { data: courses } = useCourses();
  const { data: plans, loading: plansLoading, refetch: refetchPlans, createPlan, deletePlan } = useStudyPlans();
  const { data: allTasks, loading: tasksLoading, addTask, toggleComplete, toggleStuck, deleteTask, updateTask } = useSoloTasks();

  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const [screen, setScreen] = useState<Screen>('plans');
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);

  // Create plan modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourseIdx, setNewCourseIdx] = useState(0);
  const [newDueDate, setNewDueDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTasksList, setNewTasksList] = useState('');

  // Add task
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState('');

  // Focus mode timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activePlan = useMemo(() => plans.find((p) => p.id === activePlanId) ?? null, [plans, activePlanId]);
  const planTasks = useMemo(() => activePlan?.tasks ?? [], [activePlan]);
  const focusTask = useMemo(() => planTasks.find((t) => t.id === focusTaskId) ?? null, [planTasks, focusTaskId]);

  const completedCount = useMemo(() => planTasks.filter((t) => t.completed).length, [planTasks]);
  const stuckCount = useMemo(() => planTasks.filter((t) => t.isStuck && !t.completed).length, [planTasks]);
  const totalMinutes = useMemo(() => planTasks.reduce((s, t) => s + (t.durationMinutes ?? 0), 0), [planTasks]);
  const progressPct = planTasks.length > 0 ? (completedCount / planTasks.length) * 100 : 0;

  useEffect(() => {
    Animated.spring(progressAnimation, {
      toValue: progressPct,
      useNativeDriver: false,
      friction: 8,
      tension: 70,
    }).start();
  }, [progressPct, progressAnimation]);

  // Timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDueDate = (d?: string) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysUntil = (d?: string) => {
    if (!d) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(d + 'T00:00:00');
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  // ── Handlers ──────────────────────────────────

  const handleCreatePlan = useCallback(async () => {
    if (!newTitle.trim() || courses.length === 0) return;
    const courseId = courses[newCourseIdx % courses.length].id;
    const planId = await createPlan({
      courseId,
      title: newTitle.trim(),
      dueDate: newDueDate || undefined,
      note: newNote.trim() || undefined,
    });

    // Batch-create tasks from the multi-line input
    const taskLines = newTasksList
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    for (const line of taskLines) {
      await addTask(line, courseId, planId);
    }

    setShowCreate(false);
    setNewTitle('');
    setNewDueDate('');
    setNewNote('');
    setNewTasksList('');
    refetchPlans();

    if (planId) {
      setActivePlanId(planId);
      setScreen('detail');
    }
  }, [newTitle, newCourseIdx, newDueDate, newNote, newTasksList, courses, createPlan, addTask, refetchPlans]);

  const handleAddTask = useCallback(async () => {
    if (!newTaskText.trim() || !activePlan) return;
    const dur = parseInt(newTaskDuration, 10);
    await addTask(newTaskText.trim(), activePlan.courseId, activePlan.id, isNaN(dur) ? undefined : dur);
    setNewTaskText('');
    setNewTaskDuration('');
    refetchPlans();
  }, [newTaskText, newTaskDuration, activePlan, addTask, refetchPlans]);

  const handleToggleComplete = useCallback(async (id: string) => {
    await toggleComplete(id);
    refetchPlans();
  }, [toggleComplete, refetchPlans]);

  const handleToggleStuck = useCallback(async (id: string) => {
    await toggleStuck(id);
    refetchPlans();
  }, [toggleStuck, refetchPlans]);

  const handleDeleteTask = useCallback(async (id: string) => {
    await deleteTask(id);
    refetchPlans();
  }, [deleteTask, refetchPlans]);

  const handleDeletePlan = useCallback(async (planId: string) => {
    setDeletingPlanId(planId);
    try {
      await deletePlan(planId);
      if (activePlanId === planId) {
        setActivePlanId(null);
        setScreen('plans');
      }
    } catch (err) {
      console.error('Failed to delete plan:', err);
    } finally {
      setDeletingPlanId(null);
    }
  }, [deletePlan, activePlanId]);

  const handleAskPeers = useCallback((task: SoloTask) => {
    if (!activePlan) return;
    router.push({
      pathname: '/study-request',
      params: {
        prefillCourseId: activePlan.courseId,
        prefillTopic: task.text,
        prefillGoal: activePlan.title,
      },
    } as any);
  }, [activePlan, router]);

  const openFocusMode = useCallback((taskId: string) => {
    setFocusTaskId(taskId);
    setTimerSeconds(0);
    setTimerRunning(false);
    setScreen('focus');
  }, []);

  const handleFocusComplete = useCallback(async () => {
    if (!focusTask) return;
    setTimerRunning(false);
    await toggleComplete(focusTask.id);
    refetchPlans();
    // Move to next incomplete task or exit
    const nextTask = planTasks.find((t) => !t.completed && t.id !== focusTask.id);
    if (nextTask) {
      setFocusTaskId(nextTask.id);
      setTimerSeconds(0);
    } else {
      setScreen('detail');
    }
  }, [focusTask, planTasks, toggleComplete, refetchPlans]);

  const handleFocusSkip = useCallback(() => {
    const currentIdx = planTasks.findIndex((t) => t.id === focusTaskId);
    const remaining = planTasks.filter((t, i) => !t.completed && i > currentIdx);
    const next = remaining[0] ?? planTasks.find((t) => !t.completed && t.id !== focusTaskId);
    if (next) {
      setFocusTaskId(next.id);
      setTimerSeconds(0);
      setTimerRunning(false);
    }
  }, [planTasks, focusTaskId]);

  // ── Loading ───────────────────────────────────

  if (plansLoading || tasksLoading) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={st.centered}><ActivityIndicator size="large" color={FOREST} /></View>
      </SafeAreaView>
    );
  }

  // ── FOCUS MODE ────────────────────────────────

  if (screen === 'focus' && focusTask) {
    const estMinutes = focusTask.durationMinutes ?? 25;
    const elapsed = Math.floor(timerSeconds / 60);
    const timerColor = elapsed >= estMinutes ? Colors.warning[500] : FOREST;

    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={[st.focusShell, isWide && st.focusShellWide]}>
          {/* Top bar */}
          <Pressable style={st.focusBack} onPress={() => { setTimerRunning(false); setScreen('detail'); }}>
            <ArrowLeft size={20} color={Colors.neutral[500]} />
            <Text style={st.focusBackText}>Back to plan</Text>
          </Pressable>

          <View style={st.focusContent}>
            <Text style={st.focusLabel}>FOCUS MODE</Text>
            <Text style={st.focusTaskText}>{focusTask.text}</Text>

            {focusTask.durationMinutes && (
              <Text style={st.focusEstimate}>Estimated: {focusTask.durationMinutes} min</Text>
            )}

            {/* Timer */}
            <View style={st.timerRing}>
              <Text style={[st.timerText, { color: timerColor }]}>{formatTimer(timerSeconds)}</Text>
            </View>

            {/* Controls */}
            <View style={st.focusControls}>
              <Pressable
                style={[st.focusCtrlBtn, st.focusCtrlSecondary]}
                onPress={handleFocusSkip}
              >
                <SkipForward size={18} color={Colors.neutral[600]} />
                <Text style={st.focusCtrlSecondaryText}>Skip</Text>
              </Pressable>

              <Pressable
                style={[st.focusCtrlBtn, st.focusCtrlPrimary]}
                onPress={() => setTimerRunning((r) => !r)}
              >
                {timerRunning
                  ? <Pause size={22} color={Colors.neutral[0]} />
                  : <Play size={22} color={Colors.neutral[0]} />}
              </Pressable>

              <Pressable
                style={[st.focusCtrlBtn, st.focusCtrlSuccess]}
                onPress={handleFocusComplete}
              >
                <CheckCircle size={18} color={Colors.neutral[0]} />
                <Text style={st.focusCtrlSuccessText}>Done</Text>
              </Pressable>
            </View>

            {focusTask.isStuck && (
              <Pressable style={st.focusAskBtn} onPress={() => handleAskPeers(focusTask)}>
                <Send size={14} color={Colors.neutral[0]} />
                <Text style={st.focusAskText}>Ask peers for help</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── PLAN DETAIL ───────────────────────────────

  if (screen === 'detail' && activePlan) {
    return (
      <SafeAreaView style={st.safe} edges={['top']}>
        <View style={[st.detailShell, isWide && st.detailShellWide]}>
          <FlatList
            data={planTasks}
            keyExtractor={(t) => t.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={st.detailList}
            ListHeaderComponent={
              <>
                {/* Back */}
                <Pressable style={st.detailBack} onPress={() => { setScreen('plans'); setActivePlanId(null); }}>
                  <ChevronLeft size={20} color={FOREST} />
                  <Text style={st.detailBackText}>All Plans</Text>
                </Pressable>

                {/* Plan header */}
                <View style={st.planHeader}>
                  <View style={st.planHeaderTop}>
                    <View style={st.planCoursePill}><Text style={st.planCoursePillText}>{activePlan.courseCode}</Text></View>
                    {activePlan.dueDate && (
                      <View style={st.dueBadge}>
                        <Calendar size={12} color={Colors.neutral[500]} />
                        <Text style={st.dueText}>{daysUntil(activePlan.dueDate)}</Text>
                      </View>
                    )}
                    <Pressable
                      style={st.deletePlanBtn}
                      onPress={() => handleDeletePlan(activePlan.id)}
                      disabled={deletingPlanId === activePlan.id}
                    >
                      {deletingPlanId === activePlan.id ? (
                        <ActivityIndicator size={16} color={Colors.error[600]} />
                      ) : (
                        <Trash2 size={16} color={Colors.error[600]} />
                      )}
                      <Text style={st.deletePlanBtnText}>Delete Plan</Text>
                    </Pressable>
                  </View>
                  <Text style={st.planTitle}>{activePlan.title}</Text>
                  {activePlan.note && <Text style={st.planNote}>{activePlan.note}</Text>}

                  {/* Progress */}
                  <View style={st.progressSection}>
                    <View style={st.progressRow}>
                      <Text style={st.progressLabel}>{completedCount} of {planTasks.length} tasks</Text>
                      <Text style={st.progressPct}>{Math.round(progressPct)}%</Text>
                    </View>
                    <View style={st.progressTrack}>
                      <Animated.View style={[st.progressFill, { width: progressAnimation.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
                    </View>
                    <View style={st.statsRow}>
                      {totalMinutes > 0 && (
                        <View style={st.statChip}>
                          <Clock size={12} color={Colors.neutral[500]} />
                          <Text style={st.statChipText}>{totalMinutes} min total</Text>
                        </View>
                      )}
                      {stuckCount > 0 && (
                        <View style={[st.statChip, { backgroundColor: Colors.warning[50] }]}>
                          <AlertTriangle size={12} color={Colors.warning[600]} />
                          <Text style={[st.statChipText, { color: Colors.warning[600] }]}>{stuckCount} stuck</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Focus mode CTA */}
                  {planTasks.some((t) => !t.completed) && (
                    <Pressable
                      style={st.focusCta}
                      onPress={() => {
                        const first = planTasks.find((t) => !t.completed);
                        if (first) openFocusMode(first.id);
                      }}
                    >
                      <Play size={16} color={Colors.neutral[0]} />
                      <Text style={st.focusCtaText}>Start Focus Mode</Text>
                    </Pressable>
                  )}
                </View>

                {/* Add task row */}
                <View style={st.addRow}>
                  <TextInput
                    style={st.addInput}
                    placeholder="Add a study task..."
                    placeholderTextColor={Colors.neutral[400]}
                    value={newTaskText}
                    onChangeText={setNewTaskText}
                    onSubmitEditing={handleAddTask}
                    returnKeyType="done"
                  />
                  <TextInput
                    style={st.durationInput}
                    placeholder="min"
                    placeholderTextColor={Colors.neutral[400]}
                    value={newTaskDuration}
                    onChangeText={setNewTaskDuration}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Pressable
                    style={[st.addBtn, !newTaskText.trim() && st.addBtnDisabled]}
                    onPress={handleAddTask}
                    disabled={!newTaskText.trim()}
                  >
                    <Plus size={18} color={Colors.neutral[0]} />
                  </Pressable>
                </View>
              </>
            }
            renderItem={({ item }) => {
              const done = item.completed;
              const stuck = item.isStuck && !done;
              return (
                <View style={[st.taskCard, stuck && st.taskCardStuck, done && st.taskCardDone]}>
                  <Pressable onPress={() => handleToggleComplete(item.id)} hitSlop={8} style={st.checkbox}>
                    {done ? <CheckCircle size={22} color={FOREST} /> : <Circle size={22} color={Colors.neutral[300]} />}
                  </Pressable>
                  <Pressable style={st.taskBody} onPress={() => !done && openFocusMode(item.id)}>
                    <Text style={[st.taskText, done && st.taskTextDone]} numberOfLines={2}>{item.text}</Text>
                    <View style={st.taskMeta}>
                      {item.durationMinutes && (
                        <View style={st.metaChip}><Clock size={11} color={Colors.neutral[400]} /><Text style={st.metaChipText}>{item.durationMinutes} min</Text></View>
                      )}
                      {stuck && (
                        <View style={st.stuckBadge}><AlertTriangle size={11} color={Colors.warning[600]} /><Text style={st.stuckText}>Stuck</Text></View>
                      )}
                    </View>
                  </Pressable>
                  <View style={st.taskActions}>
                    {stuck && (
                      <Pressable style={st.askBtn} onPress={() => handleAskPeers(item)}>
                        <Send size={11} color={Colors.neutral[0]} />
                        <Text style={st.askBtnText}>Ask peers</Text>
                      </Pressable>
                    )}
                    {!done && (
                      <Pressable style={[st.stuckToggle, stuck && st.stuckToggleActive]} onPress={() => handleToggleStuck(item.id)}>
                        <AlertTriangle size={13} color={stuck ? Colors.warning[600] : Colors.neutral[400]} />
                      </Pressable>
                    )}
                    <Pressable style={st.deleteBtn} onPress={() => handleDeleteTask(item.id)}>
                      <Trash2 size={14} color={Colors.neutral[400]} />
                    </Pressable>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={st.emptyState}>
                <FileText size={36} color={Colors.neutral[300]} />
                <Text style={st.emptyTitle}>No tasks yet</Text>
                <Text style={st.emptySub}>Add study tasks above to build your plan</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── PLANS LIST ────────────────────────────────

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <View style={[st.plansShell, isWide && st.plansShellWide]}>
        <FlatList
          data={plans}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={st.plansList}
          ListHeaderComponent={
            <View style={st.plansHeader}>
              <Text style={st.mainTitle}>Solo Workspace</Text>
              <Text style={st.mainSub}>Your private study plans</Text>
            </View>
          }
          renderItem={({ item }) => {
            const done = item.tasks.filter((t) => t.completed).length;
            const total = item.tasks.length;
            const pct = total > 0 ? (done / total) * 100 : 0;
            const due = daysUntil(item.dueDate);
            const hasStuck = item.tasks.some((t) => t.isStuck && !t.completed);
            return (
              <Pressable
                style={[st.planCard, isWide && st.planCardWide]}
                onPress={() => { setActivePlanId(item.id); setScreen('detail'); }}
              >
                <View style={st.planCardTop}>
                  <View style={st.planCardCoursePill}><Text style={st.planCardCoursePillText}>{item.courseCode}</Text></View>
                  {due && (
                    <View style={st.planCardDue}>
                      <Calendar size={12} color={Colors.neutral[500]} />
                      <Text style={st.planCardDueText}>{due}</Text>
                    </View>
                  )}
                </View>
                <Text style={st.planCardTitle}>{item.title}</Text>
                {item.note && <Text style={st.planCardNote} numberOfLines={2}>{item.note}</Text>}

                {/* Progress */}
                <View style={st.planCardProgress}>
                  <View style={st.planCardProgressRow}>
                    <Text style={st.planCardProgressLabel}>{done} of {total} tasks</Text>
                    {hasStuck && <AlertTriangle size={13} color={Colors.warning[500]} />}
                  </View>
                  <View style={st.planCardTrack}>
                    <View style={[st.planCardFill, { width: `${pct}%` }]} />
                  </View>
                </View>

                <View style={st.planCardArrow}><ChevronRight size={18} color={Colors.neutral[400]} /></View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <Pressable style={st.newPlanBtn} onPress={() => setShowCreate(true)}>
              <Plus size={20} color={FOREST} />
              <Text style={st.newPlanBtnText}>New Study Plan</Text>
            </Pressable>
          }
          ListEmptyComponent={
            <View style={st.emptyState}>
              <Target size={40} color={Colors.neutral[300]} />
              <Text style={st.emptyTitle}>No study plans yet</Text>
              <Text style={st.emptySub}>Create a plan to organize your study sessions</Text>
            </View>
          }
        />
      </View>

      {/* Create Plan Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View style={st.modalOverlay}>
          <ScrollView style={[st.modalScrollOuter, isWide && { maxWidth: 480 }]} contentContainerStyle={st.modalScrollContent} showsVerticalScrollIndicator={false}>
          <View style={st.modalContentInner}>
            <Text style={st.modalTitle}>New Study Plan</Text>

            <Text style={st.fieldLabel}>COURSE</Text>
            <Pressable style={st.coursePicker} onPress={() => setNewCourseIdx((i) => (i + 1) % courses.length)}>
              <BookOpen size={14} color={FOREST} />
              <Text style={st.coursePickerText}>{courses[newCourseIdx % courses.length]?.code ?? 'Select'}</Text>
            </Pressable>

            <Text style={st.fieldLabel}>GOAL / TITLE</Text>
            <TextInput
              style={st.modalInput}
              placeholder="e.g., Prepare for Midterm 1"
              placeholderTextColor={Colors.neutral[400]}
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={st.fieldLabel}>TARGET DATE (OPTIONAL)</Text>
            <View style={st.datePickerRow}>
              {[
                { label: 'Tomorrow', days: 1 },
                { label: 'In 3 days', days: 3 },
                { label: 'In 1 week', days: 7 },
                { label: 'In 2 weeks', days: 14 },
              ].map((opt) => {
                const d = new Date();
                d.setDate(d.getDate() + opt.days);
                const iso = d.toISOString().split('T')[0];
                const isActive = newDueDate === iso;
                return (
                  <Pressable
                    key={opt.days}
                    style={[st.dateChip, isActive && st.dateChipActive]}
                    onPress={() => setNewDueDate(isActive ? '' : iso)}
                  >
                    <Text style={[st.dateChipText, isActive && st.dateChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {newDueDate ? (
              <Text style={st.datePreview}>{newDueDate}</Text>
            ) : null}

            <Text style={st.fieldLabel}>NOTE (OPTIONAL)</Text>
            <TextInput
              style={[st.modalInput, { minHeight: 60 }]}
              placeholder="What do you need to cover?"
              placeholderTextColor={Colors.neutral[400]}
              value={newNote}
              onChangeText={setNewNote}
              multiline
            />

            <Text style={st.fieldLabel}>STUDY TASKS (ONE PER LINE)</Text>
            <TextInput
              style={[st.modalInput, st.tasksInput]}
              placeholder={"Review chapter 3 notes\nPractice problem set 2\nWatch lecture recordings\nMake flashcards for key terms"}
              placeholderTextColor={Colors.neutral[400]}
              value={newTasksList}
              onChangeText={setNewTasksList}
              multiline
              textAlignVertical="top"
            />
            {newTasksList.trim().length > 0 && (
              <Text style={st.taskCountPreview}>
                {newTasksList.split('\n').filter((l) => l.trim().length > 0).length} task(s) will be created
              </Text>
            )}

            <View style={st.modalActions}>
              <Pressable style={st.modalCancel} onPress={() => setShowCreate(false)}>
                <Text style={st.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[st.modalCreate, !newTitle.trim() && { backgroundColor: Colors.neutral[300] }]}
                onPress={handleCreatePlan}
                disabled={!newTitle.trim()}
              >
                <Text style={st.modalCreateText}>Create Plan</Text>
              </Pressable>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: OFF_WHITE },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Plans list
  plansShell: { flex: 1 },
  plansShellWide: { maxWidth: 700, alignSelf: 'center', width: '100%' },
  plansList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 120 },
  plansHeader: { marginBottom: Spacing.xl },
  mainTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 28, lineHeight: 34, color: FOREST },
  mainSub: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[500], marginTop: 2 },

  // Plan card
  planCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.neutral[200], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm },
  planCardWide: { padding: Spacing.xl },
  planCardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  planCardCoursePill: { backgroundColor: GOLD, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 2 },
  planCardCoursePillText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.secondary[900], letterSpacing: 0.3 },
  planCardDue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planCardDueText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral[500] },
  planCardTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 18, lineHeight: 24, color: Colors.neutral[900], marginBottom: 4 },
  planCardNote: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: Colors.neutral[500], marginBottom: Spacing.sm },
  planCardProgress: { gap: Spacing.xs },
  planCardProgressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planCardProgressLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[600] },
  planCardTrack: { height: 5, borderRadius: 3, backgroundColor: Colors.neutral[200], overflow: 'hidden' },
  planCardFill: { height: '100%', borderRadius: 3, backgroundColor: FOREST },
  planCardArrow: { position: 'absolute', right: Spacing.md, top: '50%' },

  newPlanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: Colors.neutral[200], borderStyle: 'dashed', marginTop: Spacing.sm },
  newPlanBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: FOREST },

  // Detail
  detailShell: { flex: 1 },
  detailShellWide: { maxWidth: 700, alignSelf: 'center', width: '100%' },
  detailList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 120 },
  detailBack: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
  detailBackText: { fontFamily: 'Inter-Medium', fontSize: 14, color: FOREST },

  planHeader: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm, gap: Spacing.sm },
  planHeaderTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  planCoursePill: { backgroundColor: GOLD, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 3 },
  planCoursePillText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.secondary[900], letterSpacing: 0.3 },
  dueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral[500] },
  planTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 22, lineHeight: 28, color: Colors.neutral[900] },
  planNote: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: Colors.neutral[500] },

  progressSection: { gap: Spacing.xs, marginTop: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[700] },
  progressPct: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: FOREST },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.neutral[200], overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: FOREST },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.neutral[100], paddingHorizontal: Spacing.sm + 2, paddingVertical: 3, borderRadius: BorderRadius.full },
  statChipText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral[500] },

  focusCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: FOREST, borderRadius: BorderRadius.md, paddingVertical: Spacing.sm + 4, marginTop: Spacing.sm },
  focusCtaText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral[0] },
  deletePlanBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, backgroundColor: Colors.error[50], borderWidth: 1, borderColor: Colors.error[200] },
  deletePlanBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.error[600] },

  // Add task
  addRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  addInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900], backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.neutral[200], paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  durationInput: { width: 56, fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[700], backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.neutral[200], paddingHorizontal: Spacing.sm, paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm, textAlign: 'center', ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: FOREST, alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: Colors.neutral[300] },

  // Task card
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.neutral[200], padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
  taskCardStuck: { borderColor: Colors.warning[300], backgroundColor: '#FBF6E8' },
  taskCardDone: { opacity: 0.7 },
  checkbox: { marginRight: Spacing.md, marginTop: 2 },
  taskBody: { flex: 1, marginRight: Spacing.sm },
  taskText: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22, color: Colors.neutral[900] },
  taskTextDone: { textDecorationLine: 'line-through', color: Colors.neutral[400] },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaChipText: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[400] },
  stuckBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.warning[50], paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  stuckText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.warning[600] },
  taskActions: { flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: FOREST, paddingHorizontal: Spacing.sm + 2, paddingVertical: 5, borderRadius: BorderRadius.full },
  askBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.neutral[0] },
  stuckToggle: { width: 30, height: 26, borderRadius: BorderRadius.sm, backgroundColor: Colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  stuckToggleActive: { backgroundColor: Colors.warning[100] },
  deleteBtn: { width: 30, height: 26, borderRadius: BorderRadius.sm, backgroundColor: Colors.neutral[100], alignItems: 'center', justifyContent: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 17, color: Colors.neutral[600], marginTop: Spacing.sm },
  emptySub: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[400], textAlign: 'center' },

  // Focus mode
  focusShell: { flex: 1, paddingHorizontal: Spacing.lg },
  focusShellWide: { maxWidth: 500, alignSelf: 'center', width: '100%' },
  focusBack: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: Spacing.md },
  focusBackText: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral[500] },
  focusContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, paddingBottom: 60 },
  focusLabel: { fontFamily: 'Inter-SemiBold', fontSize: 12, letterSpacing: 1.5, color: Colors.neutral[400], textTransform: 'uppercase' },
  focusTaskText: { fontFamily: 'SourceSerifPro-Bold', fontSize: 24, lineHeight: 32, color: Colors.neutral[900], textAlign: 'center', paddingHorizontal: Spacing.lg },
  focusEstimate: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[500] },
  timerRing: { width: 160, height: 160, borderRadius: 80, borderWidth: 4, borderColor: Colors.neutral[200], alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.lg },
  timerText: { fontFamily: 'Inter-SemiBold', fontSize: 40, letterSpacing: 2 },
  focusControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  focusCtrlBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full },
  focusCtrlSecondary: { backgroundColor: Colors.neutral[100] },
  focusCtrlSecondaryText: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral[600] },
  focusCtrlPrimary: { backgroundColor: FOREST, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 0 },
  focusCtrlSuccess: { backgroundColor: Colors.primary[600] },
  focusCtrlSuccessText: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral[0] },
  focusAskBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.warning[500], paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.full, marginTop: Spacing.md },
  focusAskText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[0] },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalScrollOuter: { maxHeight: '90%', width: '100%', maxWidth: 400, borderRadius: BorderRadius.xl, backgroundColor: Colors.surface, ...Shadows.lg },
  modalScrollContent: { flexGrow: 1 },
  modalContentInner: { padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '100%', maxWidth: 400, ...Shadows.lg },
  modalTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 20, color: Colors.neutral[900], marginBottom: Spacing.lg },
  fieldLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, letterSpacing: 0.8, color: Colors.neutral[500], marginBottom: 6, marginTop: Spacing.md },
  modalInput: { fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900], backgroundColor: Colors.neutral[50], borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.neutral[200], paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  datePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xs },
  dateChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.neutral[200], backgroundColor: Colors.neutral[50] },
  dateChipActive: { borderColor: FOREST, backgroundColor: Colors.primary[50] },
  dateChipText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.neutral[600] },
  dateChipTextActive: { color: FOREST },
  datePreview: { fontFamily: 'Inter-Regular', fontSize: 12, color: Colors.neutral[500], marginBottom: Spacing.xs },
  coursePicker: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.neutral[50], borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.neutral[200], paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  coursePickerText: { fontFamily: 'Inter-Medium', fontSize: 15, color: Colors.neutral[700] },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl },
  modalCancel: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.neutral[300] },
  modalCancelText: { ...Typography.bodySemiBold, color: Colors.neutral[600] },
  modalCreate: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 4, borderRadius: BorderRadius.sm, backgroundColor: FOREST },
  modalCreateText: { ...Typography.bodySemiBold, color: Colors.neutral[0] },
  tasksInput: { minHeight: 120, paddingTop: Spacing.sm + 2 },
  taskCountPreview: { fontFamily: 'Inter-Medium', fontSize: 12, color: FOREST, marginTop: 4 },
});
