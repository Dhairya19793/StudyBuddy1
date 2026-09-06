import React, { useCallback } from 'react';
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
import { MessageSquare, BookOpen, Users } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useConversations, useMarkChannelRead } from '@/hooks/useStudyData';
import type { Conversation } from '@/hooks/useStudyData';

export default function MessagesScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const router = useRouter();
  const { data: conversations, loading, refetch } = useConversations();
  const markRead = useMarkChannelRead();

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
      } else {
        router.push(`/pod/${conv.entityId}` as any);
      }
    },
    [markRead, router],
  );

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
            ) : (
              <Users size={18} color={Colors.neutral[0]} />
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
          data={conversations}
          keyExtractor={(item) => item.channelId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.title}>Messages</Text>
              <Text style={styles.subtitle}>
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </Text>
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
});
