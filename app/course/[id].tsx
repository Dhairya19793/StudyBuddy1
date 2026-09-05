import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  BookOpen,
  Users,
  MessageSquare,
  Plus,
  Clock,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  COURSES,
  COURSE_MESSAGES,
  STUDY_REQUESTS,
  Course,
  Message,
  StudyRequest,
} from '@/constants/mockData';

type Tab = 'chat' | 'requests';

export default function CourseHubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [messageText, setMessageText] = useState('');

  const isWide = width > 768;

  const course = useMemo(
    () => COURSES.find((c) => c.id === id) ?? null,
    [id],
  );

  const messages = useMemo(
    () => (id ? COURSE_MESSAGES[id] ?? [] : []),
    [id],
  );

  const courseRequests = useMemo(
    () => STUDY_REQUESTS.filter((sr) => sr.courseId === id),
    [id],
  );

  const handleSend = useCallback(() => {
    if (!messageText.trim()) return;
    setMessageText('');
  }, [messageText]);

  // ───────────────────────── helpers ─────────────────────────

  const getPreferenceLabel = (pref: StudyRequest['preference']) => {
    switch (pref) {
      case 'text-only':
        return 'Text Only';
      case 'online':
        return 'Online';
      case 'in-person':
        return 'In Person';
      case 'flexible':
        return 'Flexible';
    }
  };

  // ───────────────────────── renderers ─────────────────────────

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      if (item.isOwn) {
        return (
          <View style={styles.ownRow}>
            <View style={[styles.ownBubble, isWide && styles.bubbleWide]}>
              <Text style={styles.ownText}>{item.text}</Text>
              <Text style={styles.ownTimestamp}>{item.timestamp}</Text>
            </View>
          </View>
        );
      }

      if (item.isStudyRequest) {
        return (
          <View style={styles.otherRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{item.authorInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{item.authorName}</Text>
              <View style={[styles.studyRequestCard, isWide && styles.bubbleWide]}>
                <View style={styles.srCardHeader}>
                  <BookOpen size={14} color={Colors.primary[500]} />
                  <Text style={styles.srCardLabel}>STUDY REQUEST</Text>
                </View>
                <Text style={styles.srCardText}>{item.text}</Text>
                <Pressable
                  style={styles.srViewButton}
                  onPress={() => {
                    setActiveTab('requests');
                  }}
                >
                  <Text style={styles.srViewButtonText}>View</Text>
                </Pressable>
              </View>
              <Text style={styles.otherTimestamp}>{item.timestamp}</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.otherRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{item.authorInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{item.authorName}</Text>
            <View style={[styles.otherBubble, isWide && styles.bubbleWide]}>
              <Text style={styles.otherText}>{item.text}</Text>
            </View>
            <Text style={styles.otherTimestamp}>{item.timestamp}</Text>
          </View>
        </View>
      );
    },
    [isWide],
  );

  const renderStudyRequest = useCallback(
    ({ item }: { item: StudyRequest }) => (
      <View style={[styles.srCard, isWide && styles.srCardWide]}>
        {/* Author row */}
        <View style={styles.srAuthorRow}>
          <View style={styles.srAuthorAvatar}>
            <Text style={styles.srAuthorInitials}>{item.authorInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.srAuthorName}>{item.authorName}</Text>
          </View>
          <Text style={styles.srTime}>{item.createdAt}</Text>
        </View>

        {/* Topic */}
        <Text style={styles.srTopic}>{item.topic}</Text>

        {/* Help needed */}
        <Text style={styles.srHelp} numberOfLines={3}>
          {item.helpNeeded}
        </Text>

        {/* Tags row */}
        <View style={styles.srTagsRow}>
          <View style={styles.srTag}>
            <Text style={styles.srTagText}>{getPreferenceLabel(item.preference)}</Text>
          </View>
          <View style={styles.srTag}>
            <Users size={12} color={Colors.neutral[600]} />
            <Text style={styles.srTagText}>Up to {item.groupSize}</Text>
          </View>
        </View>

        {/* Availability */}
        <View style={styles.srAvailRow}>
          <Clock size={14} color={Colors.neutral[500]} />
          <Text style={styles.srAvailText}>{item.availability}</Text>
        </View>

        {/* Footer */}
        <View style={styles.srFooter}>
          <Text style={styles.srInterestedCount}>
            {item.interestedCount} interested
          </Text>
          <Pressable style={styles.srInterestedBtn}>
            <Text style={styles.srInterestedBtnText}>I'm Interested</Text>
          </Pressable>
        </View>
      </View>
    ),
    [isWide],
  );

  // ───────────────────────── fallback ─────────────────────────

  if (!course) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Course not found</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.goBackLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────────────── main render ─────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={12}
          >
            <ArrowLeft size={22} color={Colors.neutral[800]} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {course.code} – {course.name}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.headerStat}>
              <Users size={14} color={Colors.neutral[500]} />
              <Text style={styles.headerStatText}>{course.memberCount}</Text>
            </View>
            <View style={styles.headerStatBadge}>
              <MessageSquare size={12} color={Colors.neutral[0]} />
              <Text style={styles.headerStatBadgeText}>
                {course.activeRequests}
              </Text>
            </View>
          </View>
        </View>

        {/* ── TAB SWITCHER ── */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'chat' && styles.tabActive]}
            onPress={() => setActiveTab('chat')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'chat' && styles.tabTextActive,
              ]}
            >
              Chat
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'requests' && styles.tabTextActive,
              ]}
            >
              Study Requests
            </Text>
          </Pressable>
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>
          <View style={[styles.contentInner, isWide && styles.contentInnerWide]}>
            {activeTab === 'chat' ? (
              <>
                <FlatList
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  inverted
                  contentContainerStyle={styles.chatList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyChat}>
                      <MessageSquare size={40} color={Colors.neutral[300]} />
                      <Text style={styles.emptyChatText}>
                        No messages yet — say hi!
                      </Text>
                    </View>
                  }
                />

                {/* Input bar */}
                <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
                  <View style={styles.inputBar}>
                    <TextInput
                      ref={inputRef}
                      style={styles.textInput}
                      placeholder="Type a message…"
                      placeholderTextColor={Colors.neutral[400]}
                      value={messageText}
                      onChangeText={setMessageText}
                      multiline
                      maxLength={500}
                      returnKeyType="default"
                    />
                    <Pressable
                      onPress={handleSend}
                      style={[
                        styles.sendButton,
                        !messageText.trim() && styles.sendButtonDisabled,
                      ]}
                      disabled={!messageText.trim()}
                    >
                      <Send
                        size={18}
                        color={
                          messageText.trim()
                            ? Colors.neutral[0]
                            : Colors.neutral[400]
                        }
                      />
                    </Pressable>
                  </View>
                </SafeAreaView>
              </>
            ) : (
              <>
                <FlatList
                  data={courseRequests}
                  renderItem={renderStudyRequest}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.requestsList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyChat}>
                      <BookOpen size={40} color={Colors.neutral[300]} />
                      <Text style={styles.emptyChatText}>
                        No study requests yet
                      </Text>
                    </View>
                  }
                />

                {/* Floating New Request button */}
                <SafeAreaView edges={['bottom']} style={styles.fabSafeArea}>
                  <Pressable
                    style={styles.fab}
                    onPress={() => router.push('/study-request' as any)}
                  >
                    <Plus size={20} color={Colors.neutral[0]} />
                    <Text style={styles.fabText}>New Request</Text>
                  </Pressable>
                </SafeAreaView>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  /* ── layout shells ── */
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  notFoundText: {
    ...Typography.h3,
    color: Colors.neutral[600],
  },
  goBackLink: {
    ...Typography.bodyMedium,
    color: Colors.primary[500],
  },

  /* ── header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.neutral[900],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStatText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  headerStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  headerStatBadgeText: {
    ...Typography.label,
    color: Colors.neutral[0],
    letterSpacing: 0,
  },

  /* ── tab bar ── */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary[500],
  },
  tabText: {
    ...Typography.bodyMedium,
    color: Colors.neutral[400],
  },
  tabTextActive: {
    color: Colors.primary[500],
  },

  /* ── content ── */
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentInner: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
  contentInnerWide: {
    maxWidth: 800,
    paddingHorizontal: Spacing.lg,
  },

  /* ── chat ── */
  chatList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },

  /* own message */
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing.md,
  },
  ownBubble: {
    maxWidth: '75%',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.sm / 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  ownText: {
    ...Typography.body,
    color: Colors.neutral[0],
  },
  ownTimestamp: {
    ...Typography.small,
    color: Colors.primary[200],
    marginTop: Spacing.xs,
    textAlign: 'right',
  },

  /* other messages */
  otherRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  avatarInitials: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.primary[600],
  },
  authorName: {
    ...Typography.captionMedium,
    color: Colors.primary[500],
    marginBottom: 3,
  },
  otherBubble: {
    maxWidth: '85%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm / 2,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  otherText: {
    ...Typography.body,
    color: Colors.neutral[800],
  },
  otherTimestamp: {
    ...Typography.small,
    color: Colors.neutral[400],
    marginTop: Spacing.xs,
  },

  /* study request bubble */
  studyRequestCard: {
    maxWidth: '85%',
    backgroundColor: Colors.primary[50],
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.sm / 2,
    borderWidth: 1,
    borderColor: Colors.primary[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  srCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  srCardLabel: {
    ...Typography.label,
    color: Colors.primary[500],
    textTransform: 'uppercase',
  },
  srCardText: {
    ...Typography.body,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  srViewButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  srViewButtonText: {
    ...Typography.captionMedium,
    color: Colors.neutral[0],
  },

  bubbleWide: {
    maxWidth: '65%',
  },

  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyChatText: {
    ...Typography.body,
    color: Colors.neutral[400],
  },

  /* ── input bar ── */
  inputSafeArea: {
    backgroundColor: Colors.surface,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm,
    maxHeight: 100,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.neutral[200],
  },

  /* ── study request cards (tab 2) ── */
  requestsList: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  srCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  srCardWide: {
    maxWidth: 800,
  },
  srAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  srAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  srAuthorInitials: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.secondary[700],
  },
  srAuthorName: {
    ...Typography.bodySemiBold,
    color: Colors.neutral[800],
  },
  srTime: {
    ...Typography.small,
    color: Colors.neutral[400],
  },
  srTopic: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 17,
    lineHeight: 23,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  srHelp: {
    ...Typography.body,
    color: Colors.neutral[600],
    marginBottom: Spacing.sm,
  },
  srTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  srTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
  },
  srTagText: {
    ...Typography.caption,
    color: Colors.neutral[600],
  },
  srAvailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  srAvailText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  srFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
    paddingTop: Spacing.sm + 2,
  },
  srInterestedCount: {
    ...Typography.captionMedium,
    color: Colors.neutral[500],
  },
  srInterestedBtn: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  srInterestedBtnText: {
    ...Typography.captionMedium,
    color: Colors.neutral[0],
  },

  /* ── FAB ── */
  fabSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  fabText: {
    ...Typography.bodySemiBold,
    color: Colors.neutral[0],
  },
});
