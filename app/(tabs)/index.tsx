import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import {
  BookOpen,
  Users,
  ClipboardList,
  Plus,
  ChevronRight,
  MessageSquare,
  Heart,
  Inbox,
  FolderOpen,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useDemoUser } from '@/contexts/DemoUserContext';
import { useCourses, useStudyRequests, usePods, useSoloTasks, useWeekSchedule } from '@/hooks/useStudyData';
import UserSwitcher from '@/components/UserSwitcher';
import CalendarSchedule from '@/components/CalendarSchedule';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── Skeleton placeholder ───────────────────────── */
function SkeletonCard({ width: w, height: h }: { width: number | string; height: number }) {
  return (
    <View style={[styles.skeleton, { width: w as any, height: h }]} />
  );
}

/* ── Stagger wrapper ────────────────────────────── */
function StaggerIn({ index, children, style: extraStyle }: { index: number; children: React.ReactNode; style?: any }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(
      index * 80,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      index * 80,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, extraStyle]}>{children}</Animated.View>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width > 900;

  const { currentUser } = useDemoUser();
  const { data: courses, loading: coursesLoading, refetch: refetchCourses } = useCourses();
  const { data: studyRequests, refetch: refetchRequests } = useStudyRequests();
  const { data: pods, refetch: refetchPods } = usePods();
  const { data: soloTasks } = useSoloTasks();
  const { data: weekSchedule, loading: weekLoading } = useWeekSchedule();

  useFocusEffect(
    useCallback(() => {
      refetchCourses();
      refetchRequests();
      refetchPods();
    }, [refetchCourses, refetchRequests, refetchPods]),
  );

  const firstName = currentUser.name.split(' ')[0];
  const activePods = pods.length;
  const tasksDue = soloTasks.filter((t) => !t.completed).length;
  const courseCount = courses.length;

  if (coursesLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <View style={[styles.skeleton, { width: 240, height: 32, marginBottom: 8 }]} />
          <View style={[styles.skeleton, { width: 160, height: 16 }]} />
          <View style={styles.skeletonRow}>
            <SkeletonCard width="30%" height={80} />
            <SkeletonCard width="30%" height={80} />
            <SkeletonCard width="30%" height={80} />
          </View>
          <SkeletonCard width="100%" height={64} />
          <SkeletonCard width="100%" height={100} />
          <SkeletonCard width="100%" height={100} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <StaggerIn index={0}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.greeting}>
                {getGreeting()}, {firstName}
              </Text>
              <Text style={styles.subtitle}>Ready to study?</Text>
            </View>
            <UserSwitcher />
          </View>
        </StaggerIn>

        {/* STATS */}
        <StaggerIn index={1}>
          <View style={[styles.statsRow, isWide && styles.statsRowWide]}>
            <StatCard
              icon={<BookOpen size={18} color={Colors.secondary[500]} />}
              value={`${courseCount}`}
              label="Courses"
              isWide={isWide}
            />
            <StatCard
              icon={<Users size={18} color={Colors.secondary[500]} />}
              value={`${activePods}`}
              label="Active Pods"
              isWide={isWide}
            />
            <StatCard
              icon={<ClipboardList size={18} color={Colors.secondary[500]} />}
              value={`${tasksDue}`}
              label="Tasks Due"
              isWide={isWide}
            />
          </View>
        </StaggerIn>

        {/* CALENDAR SCHEDULE */}
        <StaggerIn index={2}>
          <CalendarSchedule items={weekSchedule} loading={weekLoading} />
        </StaggerIn>

        {/* 2-col on desktop */}
        <View style={isWide ? styles.twoColWrapper : undefined}>
          <View style={isWide ? styles.leftCol : undefined}>
            {/* CTA */}
            <StaggerIn index={3}>
              <Pressable
                style={({ pressed }) => [
                  styles.cta,
                  pressed && styles.ctaPressed,
                ]}
                onPress={() => router.push('/study-request' as any)}
              >
                <View style={styles.ctaIcon}>
                  <Plus size={20} color={Colors.neutral[0]} />
                </View>
                <View style={styles.ctaText}>
                  <Text style={styles.ctaTitle}>Create Study Request</Text>
                  <Text style={styles.ctaSub}>Find classmates to study with</Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
              </Pressable>
            </StaggerIn>

            {/* RECENT REQUESTS */}
            <StaggerIn index={4}>
              <SectionHeader
                title="Recent Study Requests"
                onSeeAll={() => router.push('/courses' as any)}
              />
            </StaggerIn>

            {studyRequests.length === 0 ? (
              <StaggerIn index={5}>
                <EmptyState
                  icon={<Inbox size={32} color={Colors.neutral[300]} />}
                  message="No study requests yet — create one above!"
                />
              </StaggerIn>
            ) : (
              <View style={isWide ? styles.requestsGrid : undefined}>
                {studyRequests.slice(0, isWide ? 4 : 3).map((req, idx) => (
                  <StaggerIn key={req.id} index={5 + idx} style={isWide ? styles.requestCardWide : undefined}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.requestCard,
                        pressed && styles.cardPressed,
                      ]}
                      onPress={() => router.push(`/course/${req.courseId}` as any)}
                    >
                      <View style={styles.requestTopRow}>
                        <View style={styles.courseCodeBadge}>
                          <Text style={styles.courseCodeText}>{req.courseCode}</Text>
                        </View>
                        <Text style={styles.requestTime}>{req.createdAt}</Text>
                      </View>
                      <Text style={styles.requestTopic} numberOfLines={2}>
                        {req.topic}
                      </Text>
                      <View style={styles.requestMeta}>
                        <Text style={styles.requestAuthor}>{req.authorName}</Text>
                        <View style={styles.interestedBadge}>
                          <Heart size={12} color={Colors.primary[500]} fill={Colors.primary[100]} />
                          <Text style={styles.interestedText}>
                            {req.interestedCount} interested
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </StaggerIn>
                ))}
              </View>
            )}
          </View>

          {/* PODS */}
          <View style={isWide ? styles.rightCol : undefined}>
            <StaggerIn index={6}>
              <SectionHeader
                title="Your Pods"
                onSeeAll={() => router.push('/pods' as any)}
              />
            </StaggerIn>

            {pods.length === 0 ? (
              <StaggerIn index={7}>
                <EmptyState
                  icon={<FolderOpen size={32} color={Colors.neutral[300]} />}
                  message="You haven't joined any pods yet."
                />
              </StaggerIn>
            ) : isWide ? (
              <View style={styles.podsVertical}>
                {pods.map((pod, idx) => (
                  <StaggerIn key={pod.id} index={7 + idx}>
                    <PodCard pod={pod} router={router} isWide />
                  </StaggerIn>
                ))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.podsScroll}
              >
                {pods.map((pod, idx) => (
                  <StaggerIn key={pod.id} index={7 + idx}>
                    <PodCard pod={pod} router={router} />
                  </StaggerIn>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function StatCard({ icon, value, label, isWide }: {
  icon: React.ReactNode; value: string; label: string; isWide: boolean;
}) {
  return (
    <View style={[styles.statCard, isWide && styles.statCardWide]}>
      <View style={styles.statIconWrap}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onSeeAll} style={styles.seeAllBtn} hitSlop={8}>
        <Text style={styles.seeAllText}>See All</Text>
        <ChevronRight size={16} color={Colors.primary[500]} />
      </Pressable>
    </View>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <View style={styles.emptyState}>
      {icon}
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

function PodCard({ pod, router, isWide }: { pod: any; router: any; isWide?: boolean }) {
  const progress = pod.tasksTotal > 0 ? pod.tasksDone / pod.tasksTotal : 0;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.podCard,
        isWide && styles.podCardWide,
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(`/pod/${pod.id}` as any)}
    >
      <View style={styles.podBadgeRow}>
        <View style={styles.podCourseBadge}>
          <Text style={styles.podCourseText}>{pod.courseCode}</Text>
        </View>
      </View>
      <Text style={styles.podName} numberOfLines={1}>{pod.name}</Text>
      <Text style={styles.podTopic} numberOfLines={1}>{pod.topic}</Text>
      <View style={styles.podMemberRow}>
        <Users size={13} color={Colors.textSecondary} />
        <Text style={styles.podMemberText}>{pod.members.length} members</Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {pod.tasksDone}/{pod.tasksTotal} tasks
      </Text>
      {pod.lastMessage ? (
        <View style={styles.podLastMsg}>
          <MessageSquare size={12} color={Colors.neutral[400]} />
          <Text style={styles.podLastMsgText} numberOfLines={2}>{pod.lastMessage}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl },

  /* skeleton loading */
  loadingContainer: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  skeleton: {
    backgroundColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    opacity: 0.5,
  },
  skeletonRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg },

  /* header */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerText: { flex: 1 },
  greeting: {
    fontFamily: 'SourceSerifPro-Bold', fontSize: 30, lineHeight: 38, color: Colors.ink,
  },
  subtitle: {
    fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22,
    color: Colors.textSecondary, marginTop: 4,
  },

  /* stats */
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statsRowWide: { gap: Spacing.md },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  statCardWide: { paddingVertical: Spacing.lg },
  statIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.secondary[50],
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: 'SourceSerifPro-Bold', fontSize: 24, lineHeight: 30, color: Colors.primary[700],
  },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  /* two-column */
  twoColWrapper: { flexDirection: 'row', gap: Spacing.lg },
  leftCol: { flex: 3 },
  rightCol: { flex: 2 },

  /* section header */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h3, color: Colors.ink },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { ...Typography.captionMedium, color: Colors.primary[500], marginRight: 2 },

  /* CTA */
  cta: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
    gap: Spacing.md, ...Shadows.md,
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  ctaIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, lineHeight: 22, color: Colors.neutral[0] },
  ctaSub: { fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  /* request cards */
  requestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  requestCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.neutral[200],
    borderLeftWidth: 3, borderLeftColor: Colors.secondary[500],
    padding: Spacing.md, paddingLeft: Spacing.md + 2, marginBottom: Spacing.sm,
  },
  requestCardWide: { width: '48%' as any, marginBottom: 0 },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  requestTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  courseCodeBadge: { backgroundColor: Colors.sage, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  courseCodeText: { ...Typography.label, color: Colors.primary[700] },
  requestTime: { ...Typography.small, color: Colors.neutral[400] },
  requestTopic: { ...Typography.bodySemiBold, color: Colors.ink, marginBottom: Spacing.sm },
  requestMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestAuthor: { ...Typography.caption, color: Colors.textSecondary },
  interestedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  interestedText: { ...Typography.small, color: Colors.primary[500] },

  /* empty */
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxl, paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  emptyStateText: { fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: Colors.neutral[400], textAlign: 'center' },

  /* pod cards */
  podsScroll: { paddingRight: Spacing.lg, paddingBottom: Spacing.xs },
  podsVertical: { gap: Spacing.md },
  podCard: { width: 220, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginRight: Spacing.md, ...Shadows.sm },
  podCardWide: { width: '100%' as any, marginRight: 0 },
  podBadgeRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  podCourseBadge: { backgroundColor: Colors.secondary[50], paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.sm },
  podCourseText: { ...Typography.label, color: Colors.secondary[700] },
  podName: { fontFamily: 'SourceSerifPro-SemiBold', fontSize: 16, lineHeight: 22, color: Colors.ink, marginBottom: 2 },
  podTopic: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  podMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  podMemberText: { ...Typography.small, color: Colors.textSecondary },
  progressBarBg: { height: 4, backgroundColor: Colors.neutral[200], borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressBarFill: { height: 4, backgroundColor: Colors.primary[500], borderRadius: 2 },
  progressLabel: { ...Typography.small, color: Colors.neutral[400], marginBottom: Spacing.sm },
  podLastMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.neutral[200] },
  podLastMsgText: { ...Typography.small, color: Colors.textSecondary, flex: 1 },
  bottomSpacer: { height: Spacing.xl },
});
