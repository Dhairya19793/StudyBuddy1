import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useDemoUser } from '@/contexts/DemoUserContext';
import { useDMMessages, useMarkChannelRead } from '@/hooks/useStudyData';

const FOREST = '#2F6B45';

export default function DMScreen() {
  const { channelId, otherName } = useLocalSearchParams<{ channelId: string; otherName: string }>();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const router = useRouter();
  const { currentUser } = useDemoUser();
  const { data: messages, loading, sendMessage } = useDMMessages(channelId ?? '');
  const markRead = useMarkChannelRead();
  const [input, setInput] = React.useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (channelId) markRead(channelId);
  }, [channelId, markRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput('');
    await sendMessage(trimmed);
  }, [input, sendMessage]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isOwn = item.isOwn;
    return (
      <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={Colors.neutral[800]} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{otherName ?? 'Direct Message'}</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={Colors.neutral[800]} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {(otherName ?? 'DM').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{otherName ?? 'Direct Message'}</Text>
          </View>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.contentInner, isWide && styles.contentInnerWide]}>
            <FlatList
              ref={listRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No messages yet — say hi!</Text>
                </View>
              }
            />

            <SafeAreaView edges={['bottom']} style={styles.inputSafeArea}>
              <View style={styles.inputBar}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Type a message…"
                  placeholderTextColor={Colors.neutral[400]}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  onPress={handleSend}
                  style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                  disabled={!input.trim()}
                >
                  <Send size={18} color={input.trim() ? Colors.neutral[0] : Colors.neutral[400]} />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.surface,
  },
  headerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm },
  headerAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#5B7C99',
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: Colors.neutral[0] },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  content: { flex: 1 },
  contentInner: { flex: 1 },
  contentInnerWide: { maxWidth: 700, alignSelf: 'center', width: '100%' },
  list: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  empty: { paddingVertical: Spacing.xxxl, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[400] },

  msgRow: { marginVertical: 3, maxWidth: '80%' },
  msgRowOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  msgRowOther: { alignSelf: 'flex-start' },
  bubble: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: BorderRadius.lg },
  bubbleOwn: { backgroundColor: FOREST, borderBottomRightRadius: BorderRadius.sm },
  bubbleOther: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.neutral[200], borderBottomLeftRadius: BorderRadius.sm },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextOwn: { color: Colors.neutral[0], fontFamily: 'Inter-Regular' },
  bubbleTextOther: { color: Colors.neutral[800], fontFamily: 'Inter-Regular' },
  timestamp: { fontSize: 11, color: Colors.neutral[400], marginTop: 2, marginHorizontal: 4 },

  inputSafeArea: { backgroundColor: Colors.surface },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.neutral[900],
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: FOREST,
    alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: Colors.neutral[300] },
});
