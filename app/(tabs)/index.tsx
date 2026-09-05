import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
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
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useDemoUser } from '@/contexts/DemoUserContext';
import { useCourses, useStudyRequests, usePods, useSoloTasks } from '@/hooks/useStudyData';
import UserSwitcher from '@/components/UserSwitcher';

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
  const isWide = width > 768;

  const { currentUser } = useDemoUser();
  const { data: courses, loading: coursesLoading, refetch: refetchCourses } = useCourses();
  const { data: studyRequests, refetch: refetchRequests } = useStudyRequests();

  useFocusEffect(
    useCallback(() => {
      refetchCourses();
      refetchRequests();
    }, [refetchCourses, refetchRequests]),
  );
  const { data: pods } = usePods();
  const { data: soloTasks } = useSoloTasks();

  const firstName = currentUser.name.split(' ')[0];
  const activePods = pods.length;
  const tasksDue = soloTasks.filter((t) => !t.completed).length;
  const courseCount = courses.length;

  if (coursesLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
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
        {/* ── HEADER ─────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.subtitle}>Ready to study?</Text>
          </View>

          <UserSwitcher />
        </View>

        {/* ── QUICK STATS ────────────────────────────────── */}
        <View style={[styles.statsRow, isWide && styles.statsRowWide]}>
          <StatCard
            icon={<BookOpen size={18} color={Colors.primary[500]} />}
            value={`${courseCount}`}
            label="Courses"
            isWide={isWide}
          />
          <StatCard
            icon={<Users size={18} color={Colors.primary[500]} />}
            value={`${activePods}`}
            label="Active Pods"
            isWide={isWide}
          />
          <StatCard
            icon={<ClipboardList size={18} color={Colors.primary[500]} />}
            value={`${tasksDue}`}
            label="Tasks Due"
            isWide={isWide}
          />
        </View>

        {/* ── CREATE STUDY REQUEST CTA ──────────────────── */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.createRequestCta}
          onPress={() => router.push('/study-request' as any)}
        >
          <View style={styles.createRequestIcon}>
            <Plus size={20} color={Colors.neutral[0]} />
          </View>
          <View style={styles.createRequestText}>
            <Text style={styles.createRequestTitle}>Create Study Request</Text>
            <Text style={styles.createRequestSubtitle}>Find classmates to study with</Text>
          </View>
          <ChevronRight size={20} color={Colors.primary[400]} />
        </TouchableOpacity>

        {/* ── RECENT STUDY REQUESTS ──────────────────────── */}
        <SectionHeader
          title="Recent Study Requests"
          onSeeAll={() => router.push('/courses' as any)}
        />

        <View style={isWide ? styles.requestsGrid : undefined}>
          {studyRequests.slice(0, isWide ? 4 : 3).map((req) => (
            <TouchableOpacity
              key={req.id}
              activeOpacity={0.7}
              style={[
                styles.requestCard,
                isWide && styles.requestCardWide,
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
            </TouchableOpacity>
          ))}
        </View>

        {/* ── YOUR PODS ──────────────────────────────────── */}
        <SectionHeader
          title="Your Pods"
          onSeeAll={() => router.push('/pods' as any)}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.podsScroll}
        >
          {pods.map((pod) => {
            const progress =
              pod.tasksTotal > 0 ? pod.tasksDone / pod.tasksTotal : 0;

            return (
              <TouchableOpacity
                key={pod.id}
                activeOpacity={0.7}
                style={styles.podCard}
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
                  <Text style={styles.podMemberText}>
                    {pod.members.length} members
                  </Text>
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
                    <MessageSquare
                      size={12}
                      color={Colors.neutral[400]}
                    />
                    <Text style={styles.podLastMsgText} numberOfLines={2}>
                      {pod.lastMessage}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* bottom spacer so FAB doesn't cover content */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* ── FAB ──────────────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        onPress={() => router.push('/study-request' as any)}
      >
        <Plus size={26} color={Colors.neutral[0]} strokeWidth={2.5} />
      </TouchableOpacity>
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
      <TouchableOpacity
        onPress={onSeeAll}
        style={styles.seeAllBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.seeAllText}>See All</Text>
        <ChevronRight size={16} color={Colors.primary[500]} />
      </TouchableOpacity>
    </View>
  );
}

/* ─── styles ─────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* layout */
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },

  /* header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    ...Typography.h1,
    color: Colors.neutral[900],
  },
  subtitle: {
    ...Typography.body,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.neutral[0],
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 22,
    color: Colors.primary[500],
    lineHeight: 28,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
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
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  requestCardWide: {
    width: '48.5%' as any,
    marginBottom: 0,
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

  /* pod cards (horizontal scroll) */
  podsScroll: {
    paddingRight: Spacing.lg,
    paddingBottom: Spacing.xs,
  },
  podCard: {
    width: 200,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginRight: Spacing.sm,
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
    fontSize: 16,
    lineHeight: 22,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  podTopic: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
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
    backgroundColor: Colors.primary[500],
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

  /* Create Study Request CTA */
  createRequestCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  createRequestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRequestText: {
    flex: 1,
  },
  createRequestTitle: {
    ...Typography.bodySemiBold,
    color: Colors.primary[700],
  },
  createRequestSubtitle: {
    ...Typography.caption,
    color: Colors.primary[400],
    marginTop: 1,
  },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    zIndex: 10,
  },
});
