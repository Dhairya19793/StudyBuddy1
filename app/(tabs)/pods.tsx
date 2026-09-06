import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Users,
  MessageSquare,
  CheckCircle,
  ChevronRight,
  Clock,
  Video,
  MapPin,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { PeerPod } from '@/constants/mockData';
import { usePods } from '@/hooks/useStudyData';

/* ── Colour tokens ──────────────────────────────── */
const FOREST_GREEN = '#2F6B45';
const MUTED_GOLD = '#D4A72C';
const OFF_WHITE = '#F8F6F0';
const MEETING_BG = '#E7EFE8';

/* ── Deterministic avatar colours ───────────────── */
const AVATAR_COLORS = [
  Colors.primary[500],
  Colors.secondary[600],
  Colors.accent[500],
  Colors.primary[700],
  Colors.secondary[800],
  Colors.accent[700],
];
function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/* ── Component ──────────────────────────────────── */
export default function PodsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: pods, loading, refetch: refetchPods } = usePods();

  useFocusEffect(
    useCallback(() => { refetchPods(); }, [refetchPods]),
  );

  const isWideScreen = width > 900;
  const numColumns = isWideScreen ? 2 : 1;

  /* ── Handlers ─────────────────────────────────── */
  const handlePodPress = useCallback(
    (podId: string) => {
      router.push(`/pod/${podId}` as any);
    },
    [router],
  );

  /* ── Member avatars ───────────────────────────── */
  const renderAvatars = useCallback(
    (members: PeerPod['members']) => {
      const MAX_SHOWN = 4;
      const shown = members.slice(0, MAX_SHOWN);
      const overflow = members.length - MAX_SHOWN;

      return (
        <View style={styles.avatarRow}>
          {shown.map((member, idx) => (
            <View
              key={member.id}
              style={[
                styles.avatar,
                { backgroundColor: avatarColor(idx), zIndex: MAX_SHOWN - idx },
                idx > 0 && { marginLeft: -10 },
              ]}
            >
              <Text style={styles.avatarText}>{member.initials}</Text>
            </View>
          ))}
          {overflow > 0 && (
            <View
              style={[
                styles.avatar,
                styles.avatarOverflow,
                { zIndex: 0, marginLeft: -10 },
              ]}
            >
              <Text style={styles.avatarOverflowText}>+{overflow}</Text>
            </View>
          )}
        </View>
      );
    },
    [],
  );

  /* ── Progress bar ─────────────────────────────── */
  const renderProgress = useCallback(
    (done: number, total: number) => {
      const pct = total > 0 ? (done / total) * 100 : 0;

      return (
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <CheckCircle size={13} color={Colors.primary[500]} />
            <Text style={styles.progressLabel}>
              {done}/{total} tasks done
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>
      );
    },
    [],
  );

  /* ── Meeting proposal ─────────────────────────── */
  const renderMeeting = useCallback(
    (proposal: NonNullable<PeerPod['meetingProposal']>) => {
      const isOnline = proposal.type === 'online';
      const MeetingIcon = isOnline ? Video : MapPin;

      return (
        <View style={styles.meetingCard}>
          <View style={styles.meetingHeader}>
            <MeetingIcon size={15} color={FOREST_GREEN} />
            <Text style={styles.meetingType}>
              {isOnline ? 'Online Meeting' : 'In-Person Meeting'}
            </Text>
          </View>

          <View style={styles.meetingDetails}>
            <Clock size={13} color={Colors.neutral[600]} />
            <Text style={styles.meetingTime} numberOfLines={1}>
              {proposal.timeWindow}
            </Text>
          </View>

          {proposal.location && (
            <View style={styles.meetingDetails}>
              <MapPin size={13} color={Colors.neutral[600]} />
              <Text style={styles.meetingTime} numberOfLines={1}>
                {proposal.location}
              </Text>
            </View>
          )}

          <View style={styles.meetingAccepted}>
            <Users size={13} color={Colors.primary[500]} />
            <Text style={styles.meetingAcceptedText}>
              {proposal.acceptedCount}/{proposal.totalCount} accepted
            </Text>
          </View>
        </View>
      );
    },
    [],
  );

  /* ── Card renderer ────────────────────────────── */
  const renderPodCard = useCallback(
    ({ item, index }: { item: PeerPod; index: number }) => (
      <Pressable
        onPress={() => handlePodPress(item.id)}
        style={({ pressed }) => [
          styles.card,
          isWideScreen && styles.cardGrid,
          isWideScreen && index % 2 === 0 && styles.cardGridLeft,
          isWideScreen && index % 2 === 1 && styles.cardGridRight,
          pressed && styles.cardPressed,
        ]}
      >
        {/* ── Header: name + course badge + chevron ── */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.podName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>{item.courseCode}</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.neutral[400]} />
        </View>

        {/* ── Topic ────────────────────────────────── */}
        <Text style={styles.topic} numberOfLines={1}>
          {item.topic}
        </Text>

        {/* ── Members ──────────────────────────────── */}
        {renderAvatars(item.members)}

        {/* ── Task progress ────────────────────────── */}
        {renderProgress(item.tasksDone, item.tasksTotal)}

        {/* ── Meeting proposal (optional) ──────────── */}
        {item.meetingProposal && renderMeeting(item.meetingProposal)}

        {/* ── Last message ─────────────────────────── */}
        {item.lastMessage && (
          <View style={styles.messagePreview}>
            <MessageSquare size={13} color={Colors.neutral[400]} />
            <Text style={styles.messageText} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.lastMessageTime && (
              <Text style={styles.messageTime}>{item.lastMessageTime}</Text>
            )}
          </View>
        )}
      </Pressable>
    ),
    [handlePodPress, isWideScreen, renderAvatars, renderProgress, renderMeeting],
  );

  /* ── Empty state ──────────────────────────────── */
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Users size={48} color={Colors.neutral[300]} />
        <Text style={styles.emptyTitle}>No pods yet</Text>
        <Text style={styles.emptySubtitle}>
          Join a course hub and respond to a study request to form your first pod.
        </Text>
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback((item: PeerPod) => item.id, []);

  /* ── Loading state ───────────────────────────── */
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  /* ── Render ───────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Peer Pods</Text>
          <Text style={styles.headerSubtitle}>Your private study groups</Text>
        </View>

        {/* Pod list */}
        <FlatList
          key={numColumns}
          data={pods}
          renderItem={renderPodCard}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.listContent,
            pods.length === 0 && styles.listContentEmpty,
          ]}
          columnWrapperStyle={isWideScreen ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          ItemSeparatorComponent={
            !isWideScreen ? () => <View style={styles.separator} /> : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
  },

  /* ── Header ──────────────────────────────────── */
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: FOREST_GREEN,
  },
  headerSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  /* ── List ─────────────────────────────────────── */
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },

  /* ── Card ─────────────────────────────────────── */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  cardGrid: {
    flex: 1,
  },
  cardGridLeft: {
    marginRight: 0,
  },
  cardGridRight: {
    marginLeft: 0,
  },
  cardPressed: {
    opacity: 0.75,
  },

  /* ── Card header row ─────────────────────────── */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.sm,
  },
  podName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.neutral[900],
    flexShrink: 1,
  },
  courseBadge: {
    backgroundColor: MUTED_GOLD,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
  },
  courseBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.secondary[900],
    letterSpacing: 0.3,
  },

  /* ── Topic ───────────────────────────────────── */
  topic: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.neutral[500],
    marginTop: 4,
  },

  /* ── Avatars ─────────────────────────────────── */
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm + 4,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[0],
    letterSpacing: 0.3,
  },
  avatarOverflow: {
    backgroundColor: Colors.neutral[200],
  },
  avatarOverflowText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[600],
  },

  /* ── Progress ────────────────────────────────── */
  progressContainer: {
    marginTop: Spacing.sm + 4,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[600],
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary[500],
  },

  /* ── Meeting proposal ────────────────────────── */
  meetingCard: {
    backgroundColor: MEETING_BG,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 4,
    marginTop: Spacing.sm + 4,
    gap: 6,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meetingType: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    color: FOREST_GREEN,
  },
  meetingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 1,
  },
  meetingTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[700],
    flexShrink: 1,
  },
  meetingAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  meetingAcceptedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary[500],
  },

  /* ── Last message ────────────────────────────── */
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm + 4,
    paddingTop: Spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
    gap: Spacing.sm,
  },
  messageText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.neutral[500],
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: Colors.neutral[400],
  },

  /* ── Empty state ─────────────────────────────── */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.bodyMedium,
    color: Colors.neutral[600],
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.neutral[400],
    textAlign: 'center',
  },
});
