import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
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
import { useCourses, useStudyRequests, usePods, useSoloTasks } from '@/hooks/useStudyData';
import UserSwitcher from '@/components/UserSwitcher';

/* ─── design tokens ─────────────────────────────────────── */

const FOREST = '#2D5F3A';
const GOLD = '#C9A93D';
const OFF_WHITE = '#F8F7F5';

/* ─── helpers ────────────────────────────────────────────── */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ─── component ──────────────────────────────────────────── */

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width > 900;

  const { currentUser } = useDemoUser();
  const { data: courses, loading: coursesLoading, refetch: refetchCourses } = useCourses();
  const { data: studyRequests, refetch: refetchRequests } = useStudyRequests();
  const { data: pods, refetch: refetchPods } = usePods();
  const { data: soloTasks } = useSoloTasks();

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

  /* ── loading state ─────────────────────────────────── */

  if (coursesLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={FOREST} />
          <Text style={styles.loadingText}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ── main render ───────────────────────────────────── */

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.subtitle}>Let's make today count 🌿</Text>
          </View>

          <UserSwitcher />
        </View>

        {/* ── QUICK STATS (full width on desktop) ────────── */}
        <View style={[styles.statsRow, isWide && styles.statsRowWide]}>
          <StatCard
            icon={<BookOpen size={18} color={GOLD} />}
            value={`${courseCount}`}
            label="Courses"
            isWide={isWide}
          />
          <StatCard
            icon={<Users size={18} color={GOLD} />}
            value={`${activePods}`}
            label="Active Pods"
            isWide={isWide}
          />
          <StatCard
            icon={<ClipboardList size={18} color={GOLD} />}
            value={`${tasksDue}`}
            label="Tasks Due"
            isWide={isWide}
          />
        </View>

        {/* ── 2-column wrapper on desktop ────────────────── */}
        <View style={isWide ? styles.twoColWrapper : undefined}>
          {/* LEFT COLUMN (or full-width on mobile) */}
          <View style={isWide ? styles.leftCol : undefined}>
            {/* ── CREATE STUDY REQUEST CTA ──────────────── */}
            <Pressable
              style={({ pressed }) => [
                styles.createRequestCta,
                pressed && styles.createRequestCtaPressed,
              ]}
              onPress={() => router.push('/study-request' as any)}
            >
              <View style={styles.createRequestIcon}>
                <Plus size={20} color={Colors.neutral[0]} />
              </View>
              <View style={styles.createRequestText}>
                <Text style={styles.createRequestTitle}>Create Study Request</Text>
                <Text style={styles.createRequestSubtitle}>
                  Find classmates to study with
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.neutral[0]} />
            </Pressable>

            {/* ── RECENT STUDY REQUESTS ─────────────────── */}
            <SectionHeader
              title="Recent Study Requests"
              onSeeAll={() => router.push('/courses' as any)}
            />

            {studyRequests.length === 0 ? (
              <EmptyState
                icon={<Inbox size={32} color={Colors.neutral[300]} />}
                message="No study requests yet — create one above!"
              />
            ) : (
              <View style={isWide ? styles.requestsGrid : undefined}>
                {studyRequests.slice(0, isWide ? 4 : 3).map((req) => (
                  <Pressable
                    key={req.id}
                    style={({ pressed }) => [
                      styles.requestCard,
                      isWide && styles.requestCardWide,
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

                    <Text style={styles.requestTopic} numberOfLines={1}>
                      {req.topic}
                    </Text>

                    <View style={styles.requestMeta}>
                      <Text style={styles.requestAuthor}>{req.authorName}</Text>

                      <View style={styles.interestedBadge}>
                        <Heart
                          size={12}
                          color={Colors.primary[500]}
                          fill={Colors.primary[100]}
                        />
                        <Text style={styles.interestedText}>
                          {req.interestedCount} interested
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* RIGHT COLUMN (or full-width on mobile) */}
          <View style={isWide ? styles.rightCol : undefined}>
            {/* ── YOUR PODS ────────────────────────────────── */}
            <SectionHeader
              title="Your Pods"
              onSeeAll={() => router.push('/pods' as any)}
            />

            {pods.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={32} color={Colors.neutral[300]} />}
                message="You haven't joined any pods yet."
              />
            ) : isWide ? (
              /* On desktop, stack pod cards vertically inside right column */
              <View style={styles.podsVertical}>
                {pods.map((pod) => (
                  <PodCardContent key={pod.id} pod={pod} router={router} />
                ))}
              </View>
            ) : (
              /* On mobile, keep horizontal scroll */
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.podsScroll}
              >
                {pods.map((pod) => (
                  <PodCardContent key={pod.id} pod={pod} router={router} />
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        {/* bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── sub-components ─────────────────────────────────────── */

function StatCard({
  icon,
  value,
  label,
  isWide,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  isWide: boolean;
}) {
  return (
    <View style={[styles.statCard, isWide && styles.statCardWide]}>
      <View style={styles.statIconWrap}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  onSeeAll,
}: {
  title: string;
  onSeeAll: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable
        onPress={onSeeAll}
        style={styles.seeAllBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.seeAllText}>See All</Text>
        <ChevronRight size={16} color={Colors.primary[500]} />
      </Pressable>
    </View>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      {icon}
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

function PodCardContent({
  pod,
  router,
}: {
  pod: any;
  router: any;
}) {
  const progress = pod.tasksTotal > 0 ? pod.tasksDone / pod.tasksTotal : 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.podCard, pressed && styles.cardPressed]}
      onPress={() => router.push('/pods' as any)}
    >
      {/* course badge */}
      <View style={styles.podBadgeRow}>
        <View style={styles.podCourseBadge}>
          <Text style={styles.podCourseText}>{pod.courseCode}</Text>
        </View>
      </View>

      {/* name */}
      <Text style={styles.podName} numberOfLines={1}>
        {pod.name}
      </Text>

      {/* topic snippet */}
      <Text style={styles.podTopic} numberOfLines={1}>
        {pod.topic}
      </Text>

      {/* members */}
      <View style={styles.podMemberRow}>
        <Users size={13} color={Colors.neutral[500]} />
        <Text style={styles.podMemberText}>{pod.members.length} members</Text>
      </View>

      {/* progress bar */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${Math.round(progress * 100)}%` },
          ]}
        />
      </View>
      <Text style={styles.progressLabel}>
        {pod.tasksDone}/{pod.tasksTotal} tasks
      </Text>

      {/* last message */}
      {pod.lastMessage ? (
        <View style={styles.podLastMsg}>
          <MessageSquare size={12} color={Colors.neutral[400]} />
          <Text style={styles.podLastMsgText} numberOfLines={2}>
            {pod.lastMessage}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ─── styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* layout */
  safe: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  /* loading */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.neutral[500],
  },

  /* header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 32,
    lineHeight: 40,
    color: FOREST,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.neutral[500],
    marginTop: 4,
  },

  /* quick stats */
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statsRowWide: {
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statCardWide: {
    paddingVertical: Spacing.lg,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 26,
    lineHeight: 32,
    color: FOREST,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  /* two-column desktop layout */
  twoColWrapper: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  leftCol: {
    flex: 3,
  },
  rightCol: {
    flex: 2,
  },

  /* section header */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.neutral[900],
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...Typography.captionMedium,
    color: Colors.primary[500],
    marginRight: 2,
  },

  /* Create Study Request CTA — premium forest green */
  createRequestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FOREST,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.md,
  },
  createRequestCtaPressed: {
    opacity: 0.88,
  },
  createRequestIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRequestText: {
    flex: 1,
  },
  createRequestTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.neutral[0],
  },
  createRequestSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  /* study-request cards */
  requestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    padding: Spacing.md,
    paddingLeft: Spacing.md + 2,
    marginBottom: Spacing.sm,
  },
  requestCardWide: {
    width: '48.5%' as any,
    marginBottom: 0,
  },
  cardPressed: {
    opacity: 0.85,
  },
  requestTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  courseCodeBadge: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  courseCodeText: {
    ...Typography.label,
    color: Colors.primary[600],
  },
  requestTime: {
    ...Typography.small,
    color: Colors.neutral[400],
  },
  requestTopic: {
    ...Typography.bodySemiBold,
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
  },
  requestMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestAuthor: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  interestedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  interestedText: {
    ...Typography.small,
    color: Colors.primary[500],
  },

  /* empty states */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral[400],
    textAlign: 'center',
  },

  /* pod cards */
  podsScroll: {
    paddingRight: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  podsVertical: {
    gap: Spacing.md,
  },
  podCard: {
    width: 228,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginRight: Spacing.md,
    ...Shadows.md,
  },
  podBadgeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  podCourseBadge: {
    backgroundColor: Colors.secondary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  podCourseText: {
    ...Typography.label,
    color: Colors.secondary[700],
  },
  podName: {
    fontFamily: 'SourceSerifPro-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  podTopic: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginBottom: Spacing.md,
  },
  podMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.sm,
  },
  podMemberText: {
    ...Typography.small,
    color: Colors.neutral[500],
  },

  /* progress bar */
  progressBarBg: {
    height: 5,
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: 5,
    backgroundColor: FOREST,
    borderRadius: 3,
  },
  progressLabel: {
    ...Typography.small,
    color: Colors.neutral[400],
    marginBottom: Spacing.sm,
  },

  /* last message preview */
  podLastMsg: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
  },
  podLastMsgText: {
    ...Typography.small,
    color: Colors.neutral[500],
    flex: 1,
  },

  /* bottom spacer */
  bottomSpacer: {
    height: Spacing.xl,
  },
});
