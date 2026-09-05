import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Mail,
  GraduationCap,
  BookOpen,
  Users,
  ClipboardList,
  Instagram,
  MessageCircle,
  Shield,
  Bell,
  ChevronRight,
  LogOut,
  Settings,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { CURRENT_USER, COURSES, PEER_PODS, SOLO_TASKS } from '@/constants/mockData';

/* ------------------------------------------------------------------ */
/*  Derived stats                                                     */
/* ------------------------------------------------------------------ */

const courseCount = COURSES.length;
const podCount = PEER_PODS.length;
const taskCount = SOLO_TASKS.length;

/* ------------------------------------------------------------------ */
/*  Small reusable pieces                                             */
/* ------------------------------------------------------------------ */

function PrivacyItem({ label }: { label: string }) {
  return (
    <View style={styles.privacyItem}>
      <View style={styles.checkCircle}>
        <Text style={styles.checkMark}>✓</Text>
      </View>
      <Text style={styles.privacyText}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

export default function ProfileScreen() {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { maxWidth: 500, width: '100%', alignSelf: 'center' as const },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ──────────────── Header ──────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* ──────────────── Avatar + identity ──────────────── */}
        <View style={styles.identitySection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitials}>{CURRENT_USER.initials}</Text>
          </View>

          <Text style={styles.name}>{CURRENT_USER.name}</Text>

          <View style={styles.emailRow}>
            <Mail size={14} color={Colors.neutral[400]} />
            <Text style={styles.email}>{CURRENT_USER.email}</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <GraduationCap size={13} color={Colors.primary[500]} />
              <Text style={styles.badgeText}>{CURRENT_USER.year}</Text>
            </View>
            <View style={styles.badge}>
              <BookOpen size={13} color={Colors.primary[500]} />
              <Text style={styles.badgeText}>{CURRENT_USER.major}</Text>
            </View>
          </View>
        </View>

        {/* ──────────────── Stats cards ──────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <BookOpen size={20} color={Colors.primary[500]} />
            <Text style={styles.statCount}>{courseCount}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>

          <View style={styles.statCard}>
            <Users size={20} color={Colors.primary[500]} />
            <Text style={styles.statCount}>{podCount}</Text>
            <Text style={styles.statLabel}>Pods</Text>
          </View>

          <View style={styles.statCard}>
            <ClipboardList size={20} color={Colors.primary[500]} />
            <Text style={styles.statCount}>{taskCount}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>

        {/* ──────────────── Social links ──────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Social Links</Text>

          <View style={styles.socialItem}>
            <Instagram size={18} color={Colors.neutral[600]} />
            <Text style={styles.socialLabel}>Instagram</Text>
            <Text style={styles.socialValue}>{CURRENT_USER.instagram}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.socialItem}>
            <MessageCircle size={18} color={Colors.neutral[600]} />
            <Text style={styles.socialLabel}>Discord</Text>
            <Text style={styles.socialValue}>{CURRENT_USER.discord}</Text>
          </View>

          <Text style={styles.socialNote}>
            Social links are only visible to your Pod members
          </Text>
        </View>

        {/* ──────────────── Privacy ──────────────── */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={Colors.primary[500]} />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <PrivacyItem label="Your schedule is always private" />
          <PrivacyItem label="Course list visible only to shared classmates" />
          <PrivacyItem label="Social links visible only in your Pods" />
        </View>

        {/* ──────────────── Settings ──────────────── */}
        <View style={styles.card}>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <Bell size={18} color={Colors.neutral[600]} />
            <Text style={styles.menuLabel}>Notifications</Text>
            <ChevronRight size={18} color={Colors.neutral[400]} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <Settings size={18} color={Colors.neutral[600]} />
            <Text style={styles.menuLabel}>Account Settings</Text>
            <ChevronRight size={18} color={Colors.neutral[400]} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <LogOut size={18} color={Colors.error[500]} />
            <Text style={[styles.menuLabel, styles.menuLabelDanger]}>
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  /* Header */
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h1,
    color: Colors.primary[500],
  },

  /* Identity */
  identitySection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitials: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: Colors.neutral[0],
    letterSpacing: 1,
  },
  name: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: Colors.neutral[900],
    textAlign: 'center',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  email: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    ...Typography.captionMedium,
    color: Colors.primary[500],
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  statCount: {
    ...Typography.bodySemiBold,
    fontSize: 18,
    color: Colors.neutral[900],
    marginTop: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },

  /* Card (shared for social, privacy, settings) */
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },

  /* Section titles */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodySemiBold,
    color: Colors.neutral[900],
    marginBottom: 0,
  },

  /* Social links */
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  socialLabel: {
    ...Typography.bodyMedium,
    color: Colors.neutral[700],
    flex: 1,
  },
  socialValue: {
    ...Typography.caption,
    color: Colors.neutral[500],
  },
  socialNote: {
    ...Typography.small,
    color: Colors.neutral[400],
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  /* Divider */
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.neutral[200],
  },

  /* Privacy */
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 6,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.primary[500],
    marginTop: -1,
  },
  privacyText: {
    ...Typography.caption,
    color: Colors.neutral[600],
    flex: 1,
  },

  /* Settings menu */
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemPressed: {
    opacity: 0.6,
  },
  menuLabel: {
    ...Typography.bodyMedium,
    color: Colors.neutral[700],
    flex: 1,
  },
  menuLabelDanger: {
    color: Colors.error[500],
  },
});
