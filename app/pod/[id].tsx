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
  Image,
  Modal,
  ScrollView,
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
  ImageIcon,
  Pin,
  HelpCircle,
  Camera,
  BookOpen,
  TrendingUp,
  X,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { PeerPod, Message, PodMember } from '@/constants/mockData';
import { usePods, usePodMessages, usePodTasks } from '@/hooks/useStudyData';

let ImagePicker: typeof import('expo-image-picker') | null = null;
if (Platform.OS !== 'web') {
  ImagePicker = require('expo-image-picker');
}

const FOREST_GREEN = '#2D5F3A';
const MUTED_GOLD = '#C9A93D';
const OFF_WHITE = '#F8F7F5';
const QUESTION_BG = '#FFF8E6';
const QUESTION_BORDER = '#E8D48B';

const AVATAR_COLORS = [
  Colors.primary[500], Colors.secondary[600], Colors.accent[500],
  Colors.primary[700], Colors.secondary[800], Colors.accent[700],
];
function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

type MessageLabel = 'question' | 'screenshot' | 'resource' | 'progress';

const LABEL_OPTIONS: { key: MessageLabel; label: string; icon: typeof HelpCircle; color: string }[] = [
  { key: 'question', label: 'Question', icon: HelpCircle, color: '#D4A017' },
  { key: 'screenshot', label: 'Screenshot', icon: Camera, color: Colors.primary[500] },
  { key: 'resource', label: 'Resource', icon: BookOpen, color: '#3B82F6' },
  { key: 'progress', label: 'Progress', icon: TrendingUp, color: '#10B981' },
];

type Tab = 'Chat' | 'Tasks' | 'Members';
const TABS: Tab[] = ['Chat', 'Tasks', 'Members'];

export default function PodDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;

  const { data: allPods, loading: podsLoading } = usePods();
  const pod = useMemo(() => allPods.find((p) => p.id === id) ?? null, [allPods, id]);

  const { data: messages, sendMessage, togglePin, markResolved } = usePodMessages(id ?? '');
  const { data: podTasks, addTask, toggleTask } = usePodTasks(id ?? '');

  const [activeTab, setActiveTab] = useState<Tab>('Chat');
  const [chatInput, setChatInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<MessageLabel | null>(null);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPinned, setShowPinned] = useState(true);

  const chatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const pinnedQuestions = useMemo(
    () => messages.filter((m) => m.isPinned && m.label === 'question' && !m.isResolved),
    [messages],
  );

  const webFileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickImage = useCallback(async () => {
    setUploadError(null);
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e: any) => {
          const file = e.target?.files?.[0];
          if (!file) return;
          if (!file.type.startsWith('image/')) {
            setUploadError('Only image files are allowed.');
            return;
          }
          const uri = URL.createObjectURL(file);
          setPendingImage({ uri, name: file.name, type: file.type });
        };
        input.click();
        return;
      }
      if (!ImagePicker) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const name = asset.fileName ?? `image-${Date.now()}.jpg`;
      const type = asset.mimeType ?? 'image/jpeg';
      if (!type.startsWith('image/')) {
        setUploadError('Only image files are allowed.');
        return;
      }
      setPendingImage({ uri: asset.uri, name, type });
    } catch {
      setUploadError('Could not access photo library.');
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    const trimmed = chatInput.trim();
    if (!trimmed && !pendingImage) return;
    setSending(true);
    setUploadError(null);
    try {
      await sendMessage(trimmed, {
        label: selectedLabel ?? undefined,
        imageUri: pendingImage?.uri,
        imageName: pendingImage?.name,
        imageMimeType: pendingImage?.type,
      });
      setChatInput('');
      setSelectedLabel(null);
      setPendingImage(null);
      setShowLabelPicker(false);
    } catch {
      setUploadError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }, [chatInput, pendingImage, selectedLabel, sendMessage]);

  const completedCount = useMemo(() => podTasks.filter((t) => t.completed).length, [podTasks]);
  const progressPct = podTasks.length > 0 ? (completedCount / podTasks.length) * 100 : 0;

  const handleAddTask = useCallback(async () => {
    const trimmed = taskInput.trim();
    if (!trimmed) return;
    setTaskInput('');
    await addTask(trimmed);
  }, [taskInput, addTask]);

  // ──── Loading / not found ──────────────────────

  if (podsLoading) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.centered}><ActivityIndicator size="large" color={FOREST_GREEN} /></View>
      </SafeAreaView>
    );
  }
  if (!pod) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.centered}>
          <Text style={s.errorText}>Pod not found</Text>
          <Pressable onPress={() => router.back()} style={s.backLink}>
            <ArrowLeft size={20} color={FOREST_GREEN} />
            <Text style={s.backLinkText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ──── Label badge ─────────────────────────────

  const LabelBadge = ({ label }: { label: string }) => {
    const opt = LABEL_OPTIONS.find((o) => o.key === label);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <View style={[s.labelBadge, { backgroundColor: opt.color + '18', borderColor: opt.color + '40' }]}>
        <Icon size={11} color={opt.color} />
        <Text style={[s.labelBadgeText, { color: opt.color }]}>{opt.label}</Text>
      </View>
    );
  };

  // ──── Message renderer ────────────────────────

  const renderMessage = ({ item }: { item: Message }) => {
    const isQuestion = item.label === 'question';
    const bubbleStyle = isQuestion
      ? [s.otherBubble, s.questionBubble]
      : [s.otherBubble];

    const content = (
      <>
        {item.label && <LabelBadge label={item.label} />}
        {item.imageUrl && (
          <Pressable onPress={() => setViewerImage(item.imageUrl!)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={s.chatImage}
              resizeMode="cover"
            />
          </Pressable>
        )}
        {item.text ? (
          <Text style={item.isOwn ? s.ownText : s.otherText}>{item.text}</Text>
        ) : null}
        <View style={s.msgFooter}>
          <Text style={item.isOwn ? s.ownTime : s.otherTime}>{item.timestamp}</Text>
          {isQuestion && !item.isResolved && (
            <Pressable style={s.pinAction} onPress={() => togglePin(item.id, !!item.isPinned)}>
              <Pin size={12} color={item.isPinned ? MUTED_GOLD : Colors.neutral[400]} />
              <Text style={[s.pinActionText, item.isPinned && { color: MUTED_GOLD }]}>
                {item.isPinned ? 'Unpin' : 'Pin'}
              </Text>
            </Pressable>
          )}
          {isQuestion && !item.isResolved && (
            <Pressable style={s.pinAction} onPress={() => markResolved(item.id)}>
              <Check size={12} color={Colors.primary[500]} />
              <Text style={[s.pinActionText, { color: Colors.primary[500] }]}>Resolve</Text>
            </Pressable>
          )}
          {isQuestion && item.isResolved && (
            <View style={s.resolvedBadge}>
              <CheckCircle size={11} color={Colors.primary[500]} />
              <Text style={s.resolvedText}>Resolved</Text>
            </View>
          )}
        </View>
      </>
    );

    if (item.isOwn) {
      return (
        <View style={s.ownRow}>
          <View style={[s.ownBubble, isQuestion && s.questionBubble]}>{content}</View>
        </View>
      );
    }

    return (
      <View style={s.otherRow}>
        <View style={[s.msgAvatar, { backgroundColor: avatarColor(item.authorName.charCodeAt(0)) }]}>
          <Text style={s.msgAvatarText}>{item.authorInitials}</Text>
        </View>
        <View style={s.otherWrap}>
          <Text style={s.msgAuthor}>{item.authorName}</Text>
          <View style={bubbleStyle}>{content}</View>
        </View>
      </View>
    );
  };

  // ──── Pinned questions banner ─────────────────

  const PinnedSection = pinnedQuestions.length > 0 ? (
    <View style={s.pinnedSection}>
      <Pressable style={s.pinnedHeader} onPress={() => setShowPinned((p) => !p)}>
        <Pin size={14} color={MUTED_GOLD} />
        <Text style={s.pinnedTitle}>Pinned Questions ({pinnedQuestions.length})</Text>
        {showPinned ? <ChevronUp size={16} color={Colors.neutral[500]} /> : <ChevronDown size={16} color={Colors.neutral[500]} />}
      </Pressable>
      {showPinned && pinnedQuestions.map((q) => (
        <View key={q.id} style={s.pinnedCard}>
          <HelpCircle size={14} color={MUTED_GOLD} />
          <View style={s.pinnedCardBody}>
            <Text style={s.pinnedCardAuthor}>{q.authorName}</Text>
            <Text style={s.pinnedCardText} numberOfLines={2}>{q.text}</Text>
          </View>
          <Pressable style={s.resolveBtn} onPress={() => markResolved(q.id)}>
            <Text style={s.resolveBtnText}>Resolve</Text>
          </Pressable>
        </View>
      ))}
    </View>
  ) : null;

  // ──── Compose bar ─────────────────────────────

  const ComposeBar = (
    <View style={s.composeWrap}>
      {uploadError && (
        <View style={s.errorBanner}>
          <Text style={s.errorBannerText}>{uploadError}</Text>
          <Pressable onPress={() => setUploadError(null)}><X size={14} color={Colors.error[600]} /></Pressable>
        </View>
      )}
      {pendingImage && (
        <View style={s.imagePreviewRow}>
          <Image source={{ uri: pendingImage.uri }} style={s.previewThumb} />
          <Text style={s.previewName} numberOfLines={1}>{pendingImage.name}</Text>
          <Pressable onPress={() => setPendingImage(null)}><X size={16} color={Colors.neutral[500]} /></Pressable>
        </View>
      )}
      {showLabelPicker && (
        <View style={s.labelRow}>
          {LABEL_OPTIONS.map((opt) => {
            const active = selectedLabel === opt.key;
            const Icon = opt.icon;
            return (
              <Pressable
                key={opt.key}
                style={[s.labelChip, active && { backgroundColor: opt.color + '20', borderColor: opt.color }]}
                onPress={() => { setSelectedLabel(active ? null : opt.key); }}
              >
                <Icon size={13} color={active ? opt.color : Colors.neutral[500]} />
                <Text style={[s.labelChipText, active && { color: opt.color }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={s.inputBar}>
        <Pressable style={s.labelToggle} onPress={() => setShowLabelPicker((p) => !p)}>
          {selectedLabel ? (
            <LabelBadge label={selectedLabel} />
          ) : (
            <HelpCircle size={20} color={Colors.neutral[400]} />
          )}
        </Pressable>
        <Pressable style={s.attachBtn} onPress={handlePickImage}>
          <ImageIcon size={20} color={Colors.neutral[500]} />
        </Pressable>
        <TextInput
          style={s.input}
          placeholder={pendingImage ? 'Add a caption...' : 'Type a message...'}
          placeholderTextColor={Colors.neutral[400]}
          value={chatInput}
          onChangeText={setChatInput}
          returnKeyType="send"
          onSubmitEditing={handleSendMessage}
          editable={!sending}
        />
        <Pressable
          style={[s.sendBtn, (!chatInput.trim() && !pendingImage) && s.btnDisabled]}
          onPress={handleSendMessage}
          disabled={(!chatInput.trim() && !pendingImage) || sending}
        >
          {sending ? <ActivityIndicator size="small" color={Colors.neutral[0]} /> : <Send size={18} color={Colors.neutral[0]} />}
        </Pressable>
      </View>
    </View>
  );

  // ──── Chat section ────────────────────────────

  const ChatSection = (
    <KeyboardAvoidingView
      style={s.flex1}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {PinnedSection}
      <FlatList
        ref={chatListRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={s.chatList}
        showsVerticalScrollIndicator={false}
      />
      {ComposeBar}
    </KeyboardAvoidingView>
  );

  // ──── Tasks section ───────────────────────────

  const renderTask = ({ item }: { item: (typeof podTasks)[0] }) => (
    <Pressable style={s.taskRow} onPress={() => toggleTask(item.id)}>
      {item.completed ? <CheckCircle size={22} color={FOREST_GREEN} /> : <Circle size={22} color={Colors.neutral[400]} />}
      <Text style={[s.taskText, item.completed && s.taskDone]}>{item.text}</Text>
      {item.assignee && <View style={s.assigneePill}><Text style={s.assigneeText}>{item.assignee}</Text></View>}
    </Pressable>
  );

  const TasksSection = (
    <KeyboardAvoidingView style={s.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <FlatList
        data={podTasks}
        keyExtractor={(t) => t.id}
        renderItem={renderTask}
        contentContainerStyle={s.tasksList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.taskProgress}>
            <Text style={s.taskProgressText}>{completedCount} of {podTasks.length} tasks completed</Text>
            <View style={s.progressTrack}><View style={[s.progressFill, { width: `${progressPct}%` }]} /></View>
          </View>
        }
      />
      <View style={s.simpleInputBar}>
        <TextInput style={s.input} placeholder="Add a task..." placeholderTextColor={Colors.neutral[400]} value={taskInput} onChangeText={setTaskInput} returnKeyType="done" onSubmitEditing={handleAddTask} />
        <Pressable style={[s.addBtn, !taskInput.trim() && s.btnDisabled]} onPress={handleAddTask} disabled={!taskInput.trim()}>
          <Plus size={18} color={Colors.neutral[0]} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );

  // ──── Members section ─────────────────────────

  const renderMember = ({ item, index }: { item: PodMember; index: number }) => (
    <View style={s.memberCard}>
      <View style={[s.memberAvatar, { backgroundColor: avatarColor(index) }]}>
        <Text style={s.memberAvatarText}>{item.initials}</Text>
      </View>
      <View style={s.memberInfo}>
        <Text style={s.memberName}>{item.name}</Text>
        <View style={s.socialRow}>
          {item.instagram && <View style={s.socialItem}><Instagram size={14} color={Colors.neutral[500]} /><Text style={s.socialText}>{item.instagram}</Text></View>}
          {item.discord && <View style={s.socialItem}><MessageCircle size={14} color={Colors.neutral[500]} /><Text style={s.socialText}>{item.discord}</Text></View>}
        </View>
      </View>
    </View>
  );

  const MembersSection = (
    <FlatList
      data={pod.members}
      keyExtractor={(m) => m.id}
      renderItem={renderMember}
      contentContainerStyle={s.membersList}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<View style={s.socialNote}><Users size={14} color={Colors.neutral[500]} /><Text style={s.socialNoteText}>Social links shared within this Pod</Text></View>}
    />
  );

  // ──── Info card ───────────────────────────────

  const InfoCard = (
    <View style={s.infoCard}>
      <View style={s.infoHeader}>
        <Text style={s.infoTitle}>{pod.name}</Text>
        <View style={s.coursePill}><Text style={s.coursePillText}>{pod.courseCode}</Text></View>
      </View>
      {pod.topic ? <Text style={s.infoTopic}>{pod.topic}</Text> : null}
      <View style={s.infoMeta}>
        <View style={s.avatarStack}>
          {pod.members.slice(0, 5).map((m, i) => (
            <View key={m.id} style={[s.stackAvatar, { backgroundColor: avatarColor(i), marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i }]}>
              <Text style={s.stackAvatarText}>{m.initials}</Text>
            </View>
          ))}
        </View>
        <Text style={s.infoMembers}>{pod.members.length} members</Text>
      </View>
    </View>
  );

  // ──── Image viewer modal ──────────────────────

  const ImageViewer = (
    <Modal visible={viewerImage !== null} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
      <Pressable style={s.viewerOverlay} onPress={() => setViewerImage(null)}>
        <SafeAreaView style={s.viewerSafe} edges={['top']}>
          <View style={s.viewerTopBar}>
            <Pressable onPress={() => setViewerImage(null)} hitSlop={12}><X size={24} color={Colors.neutral[0]} /></Pressable>
          </View>
        </SafeAreaView>
        {viewerImage && (
          <Image source={{ uri: viewerImage }} style={s.viewerImage} resizeMode="contain" />
        )}
      </Pressable>
    </Modal>
  );

  // ──── Header ──────────────────────────────────

  const Header = (
    <View style={s.header}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={s.headerBack}><ArrowLeft size={22} color={FOREST_GREEN} /></Pressable>
      <View style={s.headerCenter}>
        <Text style={s.headerTitle} numberOfLines={1}>{pod.name}</Text>
        <View style={s.headerPill}><Text style={s.headerPillText}>{pod.courseCode}</Text></View>
      </View>
      <View style={s.headerRight}><Users size={16} color={Colors.neutral[500]} /><Text style={s.headerCount}>{pod.members.length}</Text></View>
    </View>
  );

  // ──── DESKTOP ─────────────────────────────────

  if (isDesktop) {
    return (
      <SafeAreaView style={s.safeArea} edges={['top']}>
        <View style={s.desktopShell}>
          {Header}
          <View style={s.desktopContent}>
            <View style={s.desktopLeft}>
              {InfoCard}
              <View style={s.desktopChatWrap}>{ChatSection}</View>
            </View>
            <View style={s.desktopRight}>
              <Text style={s.sidebarHeading}>Members</Text>
              {MembersSection}
              <View style={s.sidebarDivider} />
              <Text style={s.sidebarHeading}>Tasks</Text>
              <View style={s.flex1}>{TasksSection}</View>
            </View>
          </View>
        </View>
        {ImageViewer}
      </SafeAreaView>
    );
  }

  // ──── MOBILE ──────────────────────────────────

  return (
    <SafeAreaView style={s.safeArea} edges={['top']}>
      <View style={s.mobileShell}>
        {Header}
        <View style={s.tabBar}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[s.tab, active && s.tabActive]}>
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>
        {activeTab === 'Chat' && ChatSection}
        {activeTab === 'Tasks' && TasksSection}
        {activeTab === 'Members' && MembersSection}
      </View>
      {ImageViewer}
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: OFF_WHITE },
  flex1: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  errorText: { ...Typography.bodyMedium, color: Colors.neutral[600] },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  backLinkText: { ...Typography.bodyMedium, color: FOREST_GREEN },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.neutral[200], backgroundColor: Colors.surface },
  headerBack: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  headerTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 18, lineHeight: 24, color: Colors.neutral[900], flexShrink: 1 },
  headerPill: { backgroundColor: MUTED_GOLD, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: 2 },
  headerPillText: { fontFamily: 'Inter-SemiBold', fontSize: 11, lineHeight: 15, color: Colors.secondary[900], letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: Spacing.sm },
  headerCount: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.neutral[500] },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.neutral[200] },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm + 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: FOREST_GREEN },
  tabLabel: { fontFamily: 'Inter-Medium', fontSize: 14, lineHeight: 20, color: Colors.neutral[400] },
  tabLabelActive: { color: FOREST_GREEN, fontFamily: 'Inter-SemiBold' },

  // Info card
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

  // Chat list
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
  questionBubble: { backgroundColor: QUESTION_BG, borderWidth: 1, borderColor: QUESTION_BORDER },

  // Labels
  labelBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1, alignSelf: 'flex-start', marginBottom: 6 },
  labelBadgeText: { fontFamily: 'Inter-SemiBold', fontSize: 10, letterSpacing: 0.3, textTransform: 'uppercase' },

  // Chat images
  chatImage: { width: '100%', height: 180, borderRadius: BorderRadius.md, marginBottom: 6, backgroundColor: Colors.neutral[100] },

  // Message footer actions
  msgFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  pinAction: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pinActionText: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.neutral[400] },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  resolvedText: { fontFamily: 'Inter-Medium', fontSize: 11, color: Colors.primary[500] },

  // Pinned section
  pinnedSection: { backgroundColor: QUESTION_BG, borderBottomWidth: 1, borderBottomColor: QUESTION_BORDER, paddingHorizontal: Spacing.md },
  pinnedHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm + 2 },
  pinnedTitle: { flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.secondary[800] },
  pinnedCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.sm + 2, marginBottom: Spacing.sm, ...Shadows.sm },
  pinnedCardBody: { flex: 1 },
  pinnedCardAuthor: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.neutral[700] },
  pinnedCardText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[600], marginTop: 2 },
  resolveBtn: { backgroundColor: Colors.primary[50], borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm + 2, paddingVertical: 4 },
  resolveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: Colors.primary[600] },

  // Compose bar
  composeWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.neutral[200], backgroundColor: Colors.surface },
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.error[50], paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  errorBannerText: { fontFamily: 'Inter-Medium', fontSize: 13, color: Colors.error[600], flex: 1 },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  previewThumb: { width: 48, height: 48, borderRadius: BorderRadius.sm, backgroundColor: Colors.neutral[100] },
  previewName: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[600] },
  labelRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, flexWrap: 'wrap' },
  labelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.neutral[300] },
  labelChipText: { fontFamily: 'Inter-Medium', fontSize: 12, color: Colors.neutral[500] },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm + 2, gap: Spacing.xs },
  simpleInputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.neutral[200], backgroundColor: Colors.surface, gap: Spacing.sm },
  labelToggle: { padding: Spacing.xs },
  attachBtn: { padding: Spacing.xs },
  input: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900], backgroundColor: Colors.neutral[100], borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm, ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: FOREST_GREEN, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: FOREST_GREEN, justifyContent: 'center', alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },

  // Tasks
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

  // Members
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

  // Image viewer
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  viewerSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 },
  viewerTopBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: Spacing.md },
  viewerImage: { width: '92%', height: '75%' },

  // Desktop
  desktopShell: { flex: 1 },
  mobileShell: { flex: 1 },
  desktopContent: { flex: 1, flexDirection: 'row', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  desktopLeft: { flex: 3, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: Colors.neutral[200] },
  desktopChatWrap: { flex: 1 },
  desktopRight: { flex: 2, paddingTop: Spacing.md },
  sidebarHeading: { fontFamily: 'Inter-SemiBold', fontSize: 13, letterSpacing: 0.8, color: Colors.neutral[500], textTransform: 'uppercase', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  sidebarDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.neutral[200], marginVertical: Spacing.md, marginHorizontal: Spacing.md },
});
