import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MessageSquare, BookOpen, Users, Plus, User as UserIcon, Search, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useConversations, useMarkChannelRead, useStartDM } from '@/hooks/useStudyData';
import { useDemoUser } from '@/contexts/DemoUserContext';
import { supabase } from '@/lib/supabase';
import type { Conversation } from '@/hooks/useStudyData';

const FOREST = '#2F6B45';

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const router = useRouter();
  const { currentUser } = useDemoUser();
  const { data: conversations, loading, refetch } = useConversations();
  const markRead = useMarkChannelRead();
  const startDM = useStartDM();
  const [showNewDM, setShowNewDM] = useState(false);
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [conversationQuery, setConversationQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState<{ id: string; name: string; initials: string }[]>([]);
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; initials: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [dmError, setDmError] = useState<string | null>(null);

  useEffect(() => {
    if (!showNewDM) return;
    let cancelled = false;
    setSearching(true);
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, initials')
        .neq('id', currentUser.id)
        .order('name', { ascending: true });
      if (cancelled) return;
      if (error) {
        setDmError('Classmates could not be loaded.');
        setPeople([]);
        setSearchResults([]);
      } else {
        const nextPeople = data ?? [];
        setPeople(nextPeople);
        setSearchResults(nextPeople);
      }
      setSearching(false);
    })();
    return () => { cancelled = true; };
  }, [showNewDM, currentUser.id]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handlePress = useCallback(
    async (conv: Conversation) => {
      await markRead(conv.channelId);
      if (conv.type === 'course') {
        router.push(`/course/${conv.entityId}` as any);
      } else if (conv.type === 'pod') {
        router.push(`/pod/${conv.entityId}` as any);
      } else {
        router.push(`/dm/${conv.channelId}?otherName=${encodeURIComponent(conv.name)}` as any);
      }
    },
    [markRead, router],
  );

  const filteredConversations = conversations.filter((conversation) => {
    const query = conversationQuery.trim().toLowerCase();
    if (!query) return true;
    return `${conversation.name} ${conversation.lastMessage ?? ''}`.toLowerCase().includes(query);
  });

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const normalized = query.trim().toLowerCase();
    setSearchResults(
      normalized.length === 0
        ? people
        : people.filter((person) => person.name.toLowerCase().includes(normalized)),
    );
  }, [people]);

  const handleStartDM = useCallback(async (userId: string, name: string) => {
    try {
      const chId = await startDM(userId);
      setShowNewDM(false);
      setSearchQuery('');
      setSearchResults([]);
      setDmError(null);
      router.push(`/dm/${chId}?otherName=${encodeURIComponent(name)}` as any);
    } catch {
      setDmError('That conversation could not be started.');
    }
  }, [startDM, router]);

  const renderItem = useCallback(
    ({ item }: { item: Conversation }) => {
      const hasUnread = item.unreadCount > 0;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.card,
            isWide && styles.cardWide,
            pressed && styles.cardPressed,
          ]}
          onPress={() => handlePress(item)}
        >
          <View style={[styles.avatar, { backgroundColor: item.color }]}>
            {item.type === 'course' ? (
              <BookOpen size={18} color={Colors.neutral[0]} />
            ) : item.type === 'pod' ? (
              <Users size={18} color={Colors.neutral[0]} />
            ) : (
              <Text style={styles.avatarText}>{item.initials}</Text>
            )}
          </View>

          <View style={styles.body}>
            <View style={styles.topRow}>
              <Text style={[styles.name, hasUnread && styles.nameBold]} numberOfLines={1}>
                {item.name}
              </Text>
              {item.lastMessageTime && (
                <Text style={[styles.time, hasUnread && styles.timeUnread]}>
                  {item.lastMessageTime}
                </Text>
              )}
            </View>
            <View style={styles.bottomRow}>
              <Text
                style={[styles.preview, hasUnread && styles.previewBold]}
                numberOfLines={1}
              >
                {item.lastMessage ?? 'No messages yet'}
              </Text>
              {hasUnread && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      );
    },
    [isWide, handlePress],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.shell, isWide && styles.shellWide]}>
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.channelId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <View>
                  <Text style={styles.title}>Messages</Text>
                  <Text style={styles.subtitle}>
                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <Pressable style={styles.searchBtn} onPress={() => setShowConversationSearch((visible) => !visible)}>
                    <Search size={18} color={Colors.primary[500]} />
                  </Pressable>
                  <Pressable style={styles.newDMBtn} onPress={() => setShowNewDM(true)}>
                    <Plus size={18} color={Colors.neutral[0]} />
                    <Text style={styles.newDMBtnText}>New</Text>
                  </Pressable>
                </View>
              </View>
              {showConversationSearch && (
                <View style={styles.conversationSearchRow}>
                  <Search size={16} color={Colors.neutral[400]} />
                  <TextInput
                    style={styles.conversationSearchInput}
                    placeholder="Search people, classes, or messages..."
                    placeholderTextColor={Colors.neutral[400]}
                    value={conversationQuery}
                    onChangeText={setConversationQuery}
                    autoFocus
                  />
                  <Pressable onPress={() => { setConversationQuery(''); setShowConversationSearch(false); }} hitSlop={8}>
                    <X size={16} color={Colors.neutral[500]} />
                  </Pressable>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MessageSquare size={40} color={Colors.neutral[300]} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                Join a course or create a study pod to start chatting
              </Text>
            </View>
          }
        />
      </View>

      {/* New DM Modal */}
      <Modal visible={showNewDM} transparent animationType="fade" onRequestClose={() => setShowNewDM(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isWide && { maxWidth: 480 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Direct Message</Text>
              <Pressable onPress={() => setShowNewDM(false)} hitSlop={12}>
                <X size={20} color={Colors.neutral[500]} />
              </Pressable>
            </View>

            <View style={styles.searchRow}>
              <Search size={16} color={Colors.neutral[400]} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search classmates by name…"
                placeholderTextColor={Colors.neutral[400]}
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            {searching && <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginVertical: Spacing.md }} />}
            {dmError && <Text style={styles.noResults}>{dmError}</Text>}

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.userRow, pressed && styles.cardPressed]}
                  onPress={() => handleStartDM(item.id, item.name)}
                >
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{item.initials}</Text>
                  </View>
                  <Text style={styles.userName}>{item.name}</Text>
                  <UserIcon size={16} color={Colors.neutral[400]} />
                </Pressable>
              )}
              ListEmptyComponent={
                !searching && searchResults.length === 0 ? (
                  <Text style={styles.noResults}>No classmates found</Text>
                ) : null
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shell: { flex: 1 },
  shellWide: { maxWidth: 700, alignSelf: 'center', width: '100%' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  header: { marginTop: Spacing.md, marginBottom: Spacing.xl },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  searchBtn: { width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary[50], borderWidth: 1, borderColor: Colors.primary[100] },
  conversationSearchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.neutral[200] },
  conversationSearchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[900] },
  title: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: Colors.primary[500],
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  newDMBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: FOREST,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  newDMBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: Colors.neutral[0] },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    ...Shadows.sm,
  },
  cardWide: { padding: Spacing.lg },
  cardPressed: { opacity: 0.8 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: Colors.neutral[0] },

  body: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },

  name: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.neutral[900],
    flex: 1,
    marginRight: Spacing.sm,
  },
  nameBold: { fontFamily: 'Inter-SemiBold' },

  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[400],
  },
  timeUnread: { color: Colors.primary[500], fontFamily: 'Inter-Medium' },

  preview: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.neutral[500],
    flex: 1,
  },
  previewBold: { fontFamily: 'Inter-Medium', color: Colors.neutral[700] },

  badge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[0],
  },

  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: Colors.neutral[600],
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[400],
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContent: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, width: '100%', maxWidth: 400, ...Shadows.lg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  modalTitle: { fontFamily: 'SourceSerifPro-Bold', fontSize: 20, color: FOREST },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.background, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.neutral[200], marginBottom: Spacing.md },
  searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 15, color: Colors.neutral[900] },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, gap: Spacing.md },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#5B7C99', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: Colors.neutral[0] },
  userName: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 15, color: Colors.neutral[900] },
  noResults: { fontFamily: 'Inter-Regular', fontSize: 14, color: Colors.neutral[400], textAlign: 'center', paddingVertical: Spacing.md },
});
