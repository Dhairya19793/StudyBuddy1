import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BookOpen, MessageSquare, ChevronRight, Search } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Course } from '@/constants/mockData';
import { useCourses } from '@/hooks/useStudyData';

function getCourseAbbreviation(code: string): string {
  const prefix = code.split(/\s+/)[0].toUpperCase();
  if (prefix.startsWith('CSC')) return 'CS';
  if (prefix.startsWith('MATH')) return 'MA';
  if (prefix.startsWith('PHIL')) return 'PH';
  if (prefix.startsWith('STAT')) return 'ST';
  if (prefix.startsWith('ENGL')) return 'EN';
  return prefix.substring(0, 2);
}

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: courses, loading } = useCourses();

  const isWideScreen = width > 900;
  const numColumns = isWideScreen ? 2 : 1;

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase().trim();
    return courses.filter(
      (course) =>
        course.code.toLowerCase().includes(query) ||
        course.name.toLowerCase().includes(query)
    );
  }, [searchQuery, courses]);

  const handleCoursePress = useCallback(
    (courseId: string) => {
      router.push(`/course/${courseId}` as any);
    },
    [router]
  );

  const renderCourseCard = useCallback(
    ({ item, index }: { item: Course; index: number }) => {
      const abbreviation = getCourseAbbreviation(item.code);

      return (
        <Pressable
          onPress={() => handleCoursePress(item.id)}
          style={({ pressed }) => [
            styles.card,
            isWideScreen && styles.cardGrid,
            isWideScreen && index % 2 === 0 && styles.cardGridLeft,
            isWideScreen && index % 2 === 1 && styles.cardGridRight,
            pressed && styles.cardPressed,
          ]}
        >
          {/* Top row: avatar + info + stats + chevron */}
          <View style={styles.cardTopRow}>
            <View style={[styles.avatar, { backgroundColor: item.color }]}>
              <Text style={styles.avatarText}>{abbreviation}</Text>
            </View>

            <View style={styles.cardInfo}>
              <Text style={styles.courseCode} numberOfLines={1}>
                {item.code}
              </Text>
              <Text style={styles.courseName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>

            <View style={styles.cardRight}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <BookOpen size={14} color={Colors.neutral[500]} />
                  <Text style={styles.statText}>{item.memberCount}</Text>
                </View>

                {item.activeRequests > 0 && (
                  <View style={styles.requestBadge}>
                    <MessageSquare size={12} color={Colors.neutral[0]} />
                    <Text style={styles.requestBadgeText}>
                      {item.activeRequests}
                    </Text>
                  </View>
                )}
              </View>
              <ChevronRight size={18} color={Colors.neutral[400]} />
            </View>
          </View>

          {/* Bottom: recent message preview */}
          {item.recentMessage && (
            <View style={styles.messagePreview}>
              <Text style={styles.messageText} numberOfLines={1}>
                "{item.recentMessage}"
              </Text>
              {item.recentMessageTime && (
                <Text style={styles.messageTime}>{item.recentMessageTime}</Text>
              )}
            </View>
          )}
        </Pressable>
      );
    },
    [handleCoursePress, isWideScreen]
  );

  const keyExtractor = useCallback((item: Course) => item.id, []);

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <BookOpen size={48} color={Colors.neutral[300]} />
        <Text style={styles.emptyTitle}>No courses found</Text>
        <Text style={styles.emptySubtitle}>
          Try adjusting your search terms
        </Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Course Hubs</Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={18} color={Colors.neutral[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              placeholderTextColor={Colors.neutral[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Course list */}
        <FlatList
          key={numColumns}
          data={filteredCourses}
          renderItem={renderCourseCard}
          keyExtractor={keyExtractor}
          numColumns={numColumns}
          contentContainerStyle={[
            styles.listContent,
            filteredCourses.length === 0 && styles.listContentEmpty,
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.primary[500],
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? Spacing.sm + 2 : Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    padding: 0,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}),
  },
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
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
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: Colors.neutral[0],
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  courseCode: {
    ...Typography.bodySemiBold,
    color: Colors.neutral[900],
  },
  courseName: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  requestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  requestBadgeText: {
    ...Typography.label,
    color: Colors.neutral[0],
    letterSpacing: 0,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
    paddingTop: Spacing.sm + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
  },
  messageText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.neutral[500],
    marginRight: Spacing.sm,
  },
  messageTime: {
    ...Typography.small,
    color: Colors.neutral[400],
  },
  separator: {
    height: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
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
  },
});
