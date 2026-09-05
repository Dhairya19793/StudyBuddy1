import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Instagram,
  MessageCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { PeerPod, Message, PodMember } from '@/constants/mockData';
import { usePods, usePodMessages, usePodTasks } from '@/hooks/useStudyData';

const FOREST_GREEN = '#2D5F3A';
const MUTED_GOLD = '#C9A93D';
const OFF_WHITE = '#F8F7F5';

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
  const isDesktop = width > 900;

  const { data: allPods, loading: podsLoading } = usePods();
  const pod = useMemo(() => allPods.find((p) => p.id === id) ?? null, [allPods, id]);

  const { data: messages, sendMessage } = usePodMessages(id ?? '');
  const { data: podTasks, addTask, toggleTask } = usePodTasks(id ?? '');

  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [chatInput, setChatInput] = useState('');
  const [taskInput, setTaskInput] = useState('');

  const chatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSendMessage = useCallback(async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    setChatInput('');
    await sendMessage(trimmed);
  }, [chatInput, sendMessage]);

  const handleAddTask = useCallback(async () => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTaskInput('');
    await addTask(trimmed);
  }, [taskInput, addTask]);

  const completedCount = useMemo(() => podTasks.filter((t) => t.completed).length, [podTasks]);
  const progressPct = podTasks.length > 0 ? (completedCount / podTasks.length) * 100 : 0;

  if (podsLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={FOREST_GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pod) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Pod not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <ArrowLeft size={20} color={FOREST_GREEN} />
            <Text style={styles.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ──── Shared renderers ──────────────────────────

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isOwn) {
      return (
        <View style={styles.ownRow}>
          <View style={styles.ownBubble}>
            <Text style={styles.ownText}>{item.text}</Text>
            <Text style={styles.ownTime}>{item.timestamp}</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styles.otherRow}>
        <View style={[styles.msgAvatar, { backgroundColor: avatarColor(item.authorName.charCodeAt(0)) }]}>
          <Text style={styles.msgAvatarText}>{item.authorInitials}</Text>
        </View>
        <View style={styles.otherWrap}>
          <Text style={styles.msgAuthor}>{item.authorName}</Text>
          <View style={styles.otherBubble}>
            <Text style={styles.otherText}>{item.text}</Text>
            <Text style={styles.otherTime}>{item.timestamp}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTask = ({ item }: { item: (typeof podTasks)[0] }) => (
    <Pressable style={styles.taskRow} onPress={() => toggleTask(item.id)}>
      {item.completed ? (
        <CheckCircle size={22} color={FOREST_GREEN} />
      ) : (
        <Circle size={22} color={Colors.neutral[400]} />
      )}
      <Text style={[styles.taskText, item.completed && styles.taskDone]}>{item.text}</Text>
      {item.assignee && (
        <View style={styles.assigneePill}>
          <Text style={styles.assigneeText}>{item.assignee}</Text>
        </View>
      )}
    </Pressable>
  );

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

  // ──── Info card ──────────────────────────────────

  const InfoCard = (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <Text style={styles.infoTitle}>{pod.name}</Text>
        <View style={styles.coursePill}>
          <Text style={styles.coursePillText}>{pod.courseCode}</Text>
        </View>
      </View>
      {pod.topic ? <Text style={styles.infoTopic}>{pod.topic}</Text> : null}
      <View style={styles.infoMeta}>
        <View style={styles.avatarStack}>
          {pod.members.slice(0, 5).map((m, i) => (
            <View
              key={m.id}
              style={[
                styles.stackAvatar,
                { backgroundColor: avatarColor(i), marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i },
              ]}
            >
              <Text style={styles.stackAvatarText}>{m.initials}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.infoMembers}>{pod.members.length} members</Text>
      </View>
    </View>
  );

  // ──── Chat section ──────────────────────────────

  const ChatSection = (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={chatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.neutral[400]}
          value={chatInput}
          onChangeText={setChatInput}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
        />
        <Pressable
          style={[styles.sendBtn, !chatInput.trim() && styles.btnDisabled]}
          onPress={handleSendMessage}
          disabled={!chatInput.trim()}
        >
          <Send size={18} color={Colors.neutral[0]} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  // ──── Tasks section ─────────────────────────────

  const TasksSection = (
    <KeyboardAvoidingView
      style={styles.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={podTasks}
        keyExtractor={(t) => t.id}
        renderItem={renderTask}
        contentContainerStyle={styles.tasksList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.taskProgress}>
            <Text style={styles.taskProgressText}>
              {completedCount} of {podTasks.length} tasks completed
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        }
      />
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Add a task..."
          placeholderTextColor={Colors.neutral[400]}
          value={taskInput}
          onChangeText={setTaskInput}
          returnKeyType="done"
          onSubmitEditing={handleAddTask}
        />
        <Pressable
          style={[styles.addBtn, !taskInput.trim() && styles.btnDisabled]}
          onPress={handleAddTask}
          disabled={!taskInput.trim()}
        >
          <Plus size={18} color={Colors.neutral[0]} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  // ──── Members section ───────────────────────────

  const MembersSection = (
    <FlatList
      data={pod.members}
      keyExtractor={(m) => m.id}
      renderItem={renderMember}
      contentContainerStyle={styles.membersList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.socialNote}>
          <Users size={14} color={Colors.neutral[500]} />
          <Text style={styles.socialNoteText}>Social links shared within this Pod</Text>
        </View>
      }
    />
  );

  // ──── DESKTOP LAYOUT ────────────────────────────

  if (isDesktop) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.desktopShell}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
              <ArrowLeft size={22} color={FOREST_GREEN} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle} numberOfLines={1}>{pod.name}</Text>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>{pod.courseCode}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Users size={16} color={Colors.neutral[500]} />
              <Text style={styles.headerCount}>{pod.members.length}</Text>
            </View>
          </View>

          {/* Workspace */}
          <View style={styles.desktopContent}>
            {/* Left: Info + Chat */}
            <View style={styles.desktopLeft}>
              {InfoCard}
              <View style={styles.desktopChatWrap}>{ChatSection}</View>
            </View>

            {/* Right: Members + Tasks */}
            <View style={styles.desktopRight}>
              <Text style={styles.sidebarHeading}>Members</Text>
              {MembersSection}
              <View style={styles.sidebarDivider} />
              <Text style={styles.sidebarHeading}>Tasks</Text>
              <View style={styles.flex1}>{TasksSection}</View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ──── MOBILE LAYOUT ─────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.mobileShell}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBack}>
            <ArrowLeft size={22} color={FOREST_GREEN} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{pod.name}</Text>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>{pod.courseCode}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Users size={16} color={Colors.neutral[500]} />
            <Text style={styles.headerCount}>{pod.members.length}</Text>
          </View>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'Chat' && ChatSection}
        {activeTab === 'Tasks' && TasksSection}
        {activeTab === 'Members' && MembersSection}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OFF_WHITE },
  flex1: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  errorText: { ...Typography.bodyMedium, color: Colors.neutral[600] },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backLinkText: { ...Typography.bodyMedium, color: FOREST_GREEN },

  // ── Header ─────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.surface,
  },
  headerBack: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  headerTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 18, lineHeight: 24, color: Colors.neutral[900], flexShrink: 1 },
  headerPill: { backgroundColor: MUTED_GOLD, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 2 },
  headerPillText: { fontFamily: 'Inter-SemiBold', fontSize: 11, lineHeight: 15, color: Colors.secondary[900], letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: Spacing.sm },
  headerCount: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral[500] },

  // ── Tab bar ────────────────────
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.neutral[200] },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: FOREST_GREEN },
  tabLabel: { fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 20, color: Colors.neutral[400] },
  tabLabelActive: { color: FOREST_GREEN, fontFamily: 'Inter-SemiBold' },

  // ── Info card ──────────────────
  infoCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, margin: Spacing.md, ...Shadows.sm, gap: Spacing.sm },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  infoTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 20, lineHeight: 26, color: Colors.neutral[900], flexShrink: 1 },
  coursePill: { backgroundColor: MUTED_GOLD, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 3 },
  coursePillText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.secondary[900], letterSpacing: 0.3 },
  infoTopic: { ...Typography.body, color: Colors.neutral[600] },
  infoMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.surface },
  stackAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 9, color: Colors.neutral[0] },
  infoMembers: { ...Typography.caption, color: Colors.neutral[500] },

  // ── Chat ───────────────────────
  chatList: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  ownRow: { alignItems: 'flex-end', marginBottom: Spacing.sm + 4 },
  ownBubble: { maxWidth: '78%', backgroundColor: FOREST_GREEN, borderRadius: BorderRadius.lg, borderBottomRightRadius: BorderRadius.sm / 2, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2 },
  ownText: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 21, color: Colors.neutral[0] },
  ownTime: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, alignSelf: 'flex-end' },
  otherRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing.sm + 4, gap: Spacing.sm },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  msgAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: Colors.neutral[0], letterSpacing: 0.3 },
  otherWrap: { maxWidth: '78%' },
  msgAuthor: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral[500], marginBottom: 3, marginLeft: 2 },
  otherBubble: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderBottomLeftRadius: BorderRadius.sm / 2, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, ...Shadows.sm },
  otherText: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 21, color: Colors.neutral[900] },
  otherTime: { fontFamily: 'Inter-Regular', fontSize: 11, color: Colors.neutral[400], marginTop: 4, alignSelf: 'flex-end' },

  // ── Input bar ──────────────────
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.neutral[200], backgroundColor: Colors.surface, gap: Spacing.sm },
  input: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900], backgroundColor: Colors.neutral[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: FOREST_GREEN, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: FOREST_GREEN, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },

  // ── Tasks ──────────────────────
  tasksList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  taskProgress: { paddingVertical: Spacing.md, gap: Spacing.sm },
  taskProgressText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[700] },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.neutral[200], overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: FOREST_GREEN },
  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, marginBottom: Spacing.sm, gap: Spacing.sm + 2, ...Shadows.sm },
  taskText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 21, color: Colors.neutral[900] },
  taskDone: { textDecorationLine: 'line-through', color: Colors.neutral[400] },
  assigneePill: { backgroundColor: Colors.neutral[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 2 },
  assigneeText: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.neutral[500] },

  // ── Members ────────────────────
  membersList: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  socialNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs },
  socialNoteText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[500], fontStyle: 'italic' },
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.md, ...Shadows.sm },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  memberAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: Colors.neutral[0], letterSpacing: 0.3 },
  memberInfo: { flex: 1, gap: 4 },
  memberName: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral[900] },
  socialRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.md },
  socialItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[500] },

  // ── Desktop layout ─────────────
  desktopShell: { flex: 1 },
  mobileShell: { flex: 1 },
  desktopContent: { flex: 1, flexDirection: 'row', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  desktopLeft: { flex: 3, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: Colors.neutral[200] },
  desktopChatWrap: { flex: 1 },
  desktopRight: { flex: 2, paddingTop: Spacing.md },
  sidebarHeading: { fontFamily: 'Inter-SemiBold', fontSize: 13, letterSpacing: 0.8, color: Colors.neutral[500], textTransform: 'uppercase', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.neutral[200], marginVertical: Spacing.md, marginHorizontal: Spacing.md },
});
