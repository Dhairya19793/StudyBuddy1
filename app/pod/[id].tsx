import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  Circle,
  Plus,
  Users,
  Video,
  MapPin,
  Clock,
  Instagram,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { PeerPod, Message, PodMember } from '@/constants/mockData';
import { usePods, usePodMessages, usePodTasks } from '@/hooks/useStudyData';

/* ── Colour tokens ──────────────────────────────── */
const FOREST_GREEN = '#2D5F3A';
const MUTED_GOLD = '#C9A93D';
const OFF_WHITE = '#F8F7F5';
const MEETING_BG = '#E8F0EC';

/* ── Avatar colours ─────────────────────────────── */
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

type Tab = 'Chat' | 'Tasks' | 'Members';
const TABS: Tab[] = ['Chat', 'Tasks', 'Members'];

export default function PodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const { data: allPods, loading: podsLoading } = usePods();
  const pod = useMemo(() => allPods.find((p) => p.id === id) ?? null, [allPods, id]);

  const { data: messages } = usePodMessages(id ?? '');
  const { data: podTasks } = usePodTasks(id ?? '');

  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [chatInput, setChatInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [tasks, setTasks] = useState(podTasks);
  const [meetingAccepted, setMeetingAccepted] = useState(false);
  const [meetingDeclined, setMeetingDeclined] = useState(false);

  useEffect(() => {
    setTasks(podTasks);
  }, [podTasks]);

  const containerMaxWidth = width > 800 ? 800 : undefined;

  /* ── Task helpers ──────────────────────────────── */
  const toggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  const addTask = useCallback(() => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTasks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, text: trimmed, completed: false },
    ]);
    setTaskInput('');
  }, [taskInput]);

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);

  /* ── Loading ──────────────────────────────────── */
  if (podsLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={FOREST_GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  /* ── Guard ─────────────────────────────────────── */
  if (!pod) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Pod not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={FOREST_GREEN} />
            <Text style={styles.backLabel}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Chat tab ──────────────────────────────────── */
  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isOwn) {
      return (
        <View style={styles.ownMessageRow}>
          <View style={styles.ownBubble}>
            <Text style={styles.ownBubbleText}>{item.text}</Text>
            <Text style={styles.ownTimestamp}>{item.timestamp}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageRow}>
        <View style={[styles.messageAvatar, { backgroundColor: avatarColor(item.authorName.charCodeAt(0)) }]}>
          <Text style={styles.messageAvatarText}>{item.authorInitials}</Text>
        </View>
        <View style={styles.otherBubbleWrap}>
          <Text style={styles.messageAuthor}>{item.authorName}</Text>
          <View style={styles.otherBubble}>
            <Text style={styles.otherBubbleText}>{item.text}</Text>
            <Text style={styles.otherTimestamp}>{item.timestamp}</Text>
          </View>
        </View>
      </View>
    );
  };

  const ChatTab = (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInputField}
          placeholder="Type a message..."
          placeholderTextColor={Colors.neutral[400]}
          value={chatInput}
          onChangeText={setChatInput}
          returnKeyType="send"
          onSubmitEditing={() => setChatInput('')}
        />
        <Pressable
          style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
          onPress={() => setChatInput('')}
          disabled={!chatInput.trim()}
        >
          <Send size={18} color={Colors.neutral[0]} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  /* ── Tasks tab ─────────────────────────────────── */
  const progressPct = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const renderTask = ({ item }: { item: (typeof tasks)[0] }) => (
    <Pressable style={styles.taskRow} onPress={() => toggleTask(item.id)}>
      {item.completed ? (
        <CheckCircle size={22} color={FOREST_GREEN} />
      ) : (
        <Circle size={22} color={Colors.neutral[400]} />
      )}
      <Text
        style={[
          styles.taskText,
          item.completed && styles.taskTextDone,
        ]}
      >
        {item.text}
      </Text>
      {item.assignee && (
        <View style={styles.assigneePill}>
          <Text style={styles.assigneeText}>{item.assignee}</Text>
        </View>
      )}
    </Pressable>
  );

  const TasksTab = (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        renderItem={renderTask}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.taskSummary}>
            <Text style={styles.taskSummaryText}>
              {completedCount} of {tasks.length} tasks completed
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        }
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInputField}
          placeholder="Add a task..."
          placeholderTextColor={Colors.neutral[400]}
          value={taskInput}
          onChangeText={setTaskInput}
          returnKeyType="done"
          onSubmitEditing={addTask}
        />
        <Pressable
          style={[styles.addTaskBtn, !taskInput.trim() && styles.sendBtnDisabled]}
          onPress={addTask}
          disabled={!taskInput.trim()}
        >
          <Plus size={18} color={Colors.neutral[0]} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  /* ── Members tab ───────────────────────────────── */
  const renderMember = ({ item, index }: { item: PodMember; index: number }) => (
    <View style={styles.memberCard}>
      <View style={[styles.memberAvatar, { backgroundColor: avatarColor(index) }]}>
        <Text style={styles.memberAvatarText}>{item.initials}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <View style={styles.socialRow}>
          {item.instagram && (
            <View style={styles.socialItem}>
              <Instagram size={14} color={Colors.neutral[500]} />
              <Text style={styles.socialText}>{item.instagram}</Text>
            </View>
          )}
          {item.discord && (
            <View style={styles.socialItem}>
              <MessageCircle size={14} color={Colors.neutral[500]} />
              <Text style={styles.socialText}>{item.discord}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  const meetingProposal = pod.meetingProposal;
  const isOnline = meetingProposal?.type === 'online';
  const MeetingIcon = isOnline ? Video : MapPin;

  const MembersTab = (
    <FlatList
      data={pod.members}
      keyExtractor={(m) => m.id}
      renderItem={renderMember}
      contentContainerStyle={styles.membersList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View>
          <View style={styles.socialNote}>
            <Users size={14} color={Colors.neutral[500]} />
            <Text style={styles.socialNoteText}>
              Social links are shared within this Pod
            </Text>
          </View>

          {meetingProposal && (
            <View style={styles.meetingCard}>
              <View style={styles.meetingHeader}>
                <MeetingIcon size={16} color={FOREST_GREEN} />
                <Text style={styles.meetingTitle}>Meeting Proposal</Text>
              </View>

              <Text style={styles.meetingProposedBy}>
                Proposed by {meetingProposal.proposedBy}
              </Text>

              <View style={styles.meetingDetailRow}>
                <Clock size={14} color={Colors.neutral[600]} />
                <Text style={styles.meetingDetailText}>
                  {meetingProposal.timeWindow}
                </Text>
              </View>

              {meetingProposal.location && (
                <View style={styles.meetingDetailRow}>
                  <MapPin size={14} color={Colors.neutral[600]} />
                  <Text style={styles.meetingDetailText}>
                    {meetingProposal.location}
                  </Text>
                </View>
              )}

              <View style={styles.meetingAcceptedRow}>
                <Users size={14} color={FOREST_GREEN} />
                <Text style={styles.meetingAcceptedText}>
                  {meetingProposal.acceptedCount} of {meetingProposal.totalCount}{' '}
                  accepted
                </Text>
              </View>

              {!meetingAccepted && !meetingDeclined && (
                <View style={styles.meetingActions}>
                  <Pressable
                    style={styles.acceptBtn}
                    onPress={() => setMeetingAccepted(true)}
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={styles.declineBtn}
                    onPress={() => setMeetingDeclined(true)}
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </Pressable>
                </View>
              )}
              {meetingAccepted && (
                <View style={styles.meetingResponseBadge}>
                  <CheckCircle size={14} color={FOREST_GREEN} />
                  <Text style={styles.meetingResponseText}>You accepted</Text>
                </View>
              )}
              {meetingDeclined && (
                <View style={styles.meetingResponseBadge}>
                  <Text style={styles.meetingResponseTextDeclined}>You declined</Text>
                </View>
              )}
            </View>
          )}
        </View>
      }
    />
  );

  /* ── Main render ───────────────────────────────── */
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : undefined]}>
        {/* ── Header ─────────────────────────────── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBackBtn}>
            <ArrowLeft size={22} color={FOREST_GREEN} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {pod.name}
            </Text>
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>{pod.courseCode}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Users size={16} color={Colors.neutral[500]} />
            <Text style={styles.memberCountText}>{pod.members.length}</Text>
          </View>
        </View>

        {/* ── Tab switcher ───────────────────────── */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Tab content ────────────────────────── */}
        {activeTab === 'Chat' && ChatTab}
        {activeTab === 'Tasks' && TasksTab}
        {activeTab === 'Members' && MembersTab}
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
  flex1: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.neutral[600],
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backLabel: {
    ...Typography.bodyMedium,
    color: FOREST_GREEN,
  },

  /* ── Header ──────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.surface,
  },
  headerBackBtn: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginRight: Spacing.xs,
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 18,
    lineHeight: 24,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: Spacing.sm,
  },
  memberCountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[500],
  },

  /* ── Tab bar ─────────────────────────────────── */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: FOREST_GREEN,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral[400],
  },
  tabTextActive: {
    color: FOREST_GREEN,
    fontFamily: 'Inter-SemiBold',
  },

  /* ── Chat ─────────────────────────────────────── */
  chatList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  ownMessageRow: {
    alignItems: 'flex-end',
    marginBottom: Spacing.sm + 4,
  },
  ownBubble: {
    maxWidth: '78%',
    backgroundColor: FOREST_GREEN,
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.sm / 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  ownBubbleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.neutral[0],
  },
  ownTimestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[0],
    letterSpacing: 0.3,
  },
  otherBubbleWrap: {
    maxWidth: '78%',
  },
  messageAuthor: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[500],
    marginBottom: 3,
    marginLeft: 2,
  },
  otherBubble: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm / 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Shadows.sm,
  },
  otherBubbleText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.neutral[900],
  },
  otherTimestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.neutral[400],
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  /* ── Input bar (shared chat / task) ────────────── */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  chatInputField: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.neutral[900],
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FOREST_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  addTaskBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: FOREST_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Tasks ────────────────────────────────────── */
  tasksList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  taskSummary: {
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  taskSummaryText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neutral[200],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: FOREST_GREEN,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    marginBottom: Spacing.sm,
    gap: Spacing.sm + 2,
    ...Shadows.sm,
  },
  taskText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.neutral[900],
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[400],
  },
  assigneePill: {
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
  },
  assigneeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.neutral[500],
  },

  /* ── Members ──────────────────────────────────── */
  membersList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  socialNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  socialNoteText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.neutral[500],
    fontStyle: 'italic',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.neutral[0],
    letterSpacing: 0.3,
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.neutral[500],
  },

  /* ── Meeting proposal card ─────────────────────── */
  meetingCard: {
    backgroundColor: MEETING_BG,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  meetingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: FOREST_GREEN,
  },
  meetingProposedBy: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.neutral[600],
  },
  meetingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meetingDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: Colors.neutral[700],
  },
  meetingAcceptedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  meetingAcceptedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: FOREST_GREEN,
  },
  meetingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: FOREST_GREEN,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[0],
  },
  declineBtn: {
    flex: 1,
    backgroundColor: Colors.neutral[0],
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  declineBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[600],
  },
  meetingResponseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.xs,
  },
  meetingResponseText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: FOREST_GREEN,
  },
  meetingResponseTextDeclined: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: Colors.neutral[500],
  },
});
