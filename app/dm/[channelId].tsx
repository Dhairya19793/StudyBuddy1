import React, { useCallback, useRef, useEffect, useState } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, ImageIcon, X } from 'lucide-react-native';
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
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (channelId) markRead(channelId);
  }, [channelId, markRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handlePickImage = useCallback(() => {
    setUploadError(null);
    if (Platform.OS === 'web') {
      const el = document.createElement('input');
      el.type = 'file';
      el.accept = 'image/*';
      el.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          setUploadError('Only image files are allowed.');
          return;
        }
        setPendingImage({ uri: URL.createObjectURL(file), name: file.name, type: file.type });
      };
      el.click();
    }
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed && !pendingImage) return;
    setSending(true);
    setUploadError(null);
    try {
      await sendMessage(trimmed, {
        imageUri: pendingImage?.uri,
        imageName: pendingImage?.name,
        imageMimeType: pendingImage?.type,
      });
      setInput('');
      setPendingImage(null);
    } catch {
      setUploadError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }, [input, pendingImage, sendMessage]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const isOwn = item.isOwn;
    return (
      <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
          {item.imageUrl && (
            <Pressable onPress={() => setViewerImage(item.imageUrl)}>
              <Image source={{ uri: item.imageUrl }} style={styles.chatImage} resizeMode="cover" />
            </Pressable>
          )}
          {item.text ? (
            <Text style={[styles.bubbleText, isOwn ? styles.bubbleTextOwn : styles.bubbleTextOther]}>
              {item.text}
            </Text>
          ) : null}
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
                {uploadError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{uploadError}</Text>
                    <Pressable onPress={() => setUploadError(null)}><X size={14} color={Colors.error[600]} /></Pressable>
                  </View>
                )}
                {pendingImage && (
                  <View style={styles.imagePreviewRow}>
                    <Image source={{ uri: pendingImage.uri }} style={styles.previewThumb} />
                    <Text style={styles.previewName} numberOfLines={1}>{pendingImage.name}</Text>
                    <Pressable onPress={() => setPendingImage(null)}><X size={16} color={Colors.neutral[500]} /></Pressable>
                  </View>
                )}
                <Pressable style={styles.attachBtn} onPress={handlePickImage}>
                  <ImageIcon size={20} color={Colors.neutral[500]} />
                </Pressable>
                <TextInput
                  style={styles.textInput}
                  placeholder={pendingImage ? 'Add a caption...' : 'Type a message...'}
                  placeholderTextColor={Colors.neutral[400]}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={500}
                />
                <Pressable
                  onPress={handleSend}
                  style={[styles.sendButton, (!input.trim() && !pendingImage) && styles.sendButtonDisabled]}
                  disabled={(!input.trim() && !pendingImage) || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color={Colors.neutral[0]} />
                  ) : (
                    <Send size={18} color={input.trim() || pendingImage ? Colors.neutral[0] : Colors.neutral[400]} />
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={viewerImage !== null} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <Pressable style={styles.viewerOverlay} onPress={() => setViewerImage(null)}>
          <SafeAreaView style={styles.viewerSafe} edges={['top']}>
            <View style={styles.viewerTopBar}>
              <Pressable onPress={() => setViewerImage(null)} hitSlop={12}><X size={24} color={Colors.neutral[0]} /></Pressable>
            </View>
          </SafeAreaView>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={styles.viewerImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
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
  chatImage: { width: 220, height: 160, borderRadius: BorderRadius.md, marginBottom: 6, backgroundColor: Colors.neutral[100] },
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
  attachBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.neutral[100] },
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
  errorBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.error[50], borderRadius: BorderRadius.md, marginBottom: Spacing.sm, width: '100%' },
  errorBannerText: { fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.error[600], flex: 1 },
  imagePreviewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.neutral[50], borderRadius: BorderRadius.md, marginBottom: Spacing.sm, width: '100%' },
  previewThumb: { width: 48, height: 48, borderRadius: BorderRadius.sm, backgroundColor: Colors.neutral[200] },
  previewName: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: Colors.neutral[600] },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' },
  viewerSafe: { width: '100%' },
  viewerTopBar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  viewerImage: { flex: 1, width: '100%' },
});
