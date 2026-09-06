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
import { useDemoUser } from '@/contexts/DemoUserContext';
import { useCourses, usePods, useSoloTasks } from '@/hooks/useStudyData';
import UserSwitcher from '@/components/UserSwitcher';

/* ── Design tokens ─────────────────────────────────────────────────── */
const FOREST = '#2F6B45';
const GOLD = '#D4A72C';
const OFF_WHITE = '#F8F6F0';

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

function SocialRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.socialItem}>
      <View style={styles.socialIconWrap}>{icon}</View>
      <Text style={styles.socialLabel}>{label}</Text>
      <Text style={styles.socialValue}>{value}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const { currentUser } = useDemoUser();
  const { data: courses } = useCourses();
  const { data: pods } = usePods();
  const { data: soloTasks } = useSoloTasks();

  const courseCount = courses.length;
  const podCount = pods.length;
  const taskCount = soloTasks.length;

  const hasInstagram = !!currentUser.instagram;
  const hasDiscord = !!currentUser.discord;
  const hasSocialLinks = hasInstagram || hasDiscord;

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
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{currentUser.initials}</Text>
            </View>
          </View>

          <Text style={styles.name}>{currentUser.name}</Text>

          <View style={styles.emailRow}>
            <Mail size={14} color={Colors.neutral[400]} />
            <Text style={styles.email}>{currentUser.email}</Text>
          </View>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <GraduationCap size={13} color={Colors.primary[500]} />
              <Text style={styles.badgeText}>{currentUser.year}</Text>
            </View>
            <View style={styles.badge}>
              <BookOpen size={13} color={Colors.primary[500]} />
              <Text style={styles.badgeText}>{currentUser.major}</Text>
            </View>
          </View>

          {/* Demo Mode switcher */}
          <View style={styles.demoModeWrap}>
            <View style={styles.demoModeLabelRow}>
              <View style={styles.demoDot} />
              <Text style={styles.demoModeText}>Demo Mode</Text>
            </View>
            <UserSwitcher />
          </View>
        </View>

        {/* ──────────────── Stats cards ──────────────── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <BookOpen size={18} color={GOLD} />
            </View>
            <Text style={styles.statCount}>{courseCount}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Users size={18} color={GOLD} />
            </View>
            <Text style={styles.statCount}>{podCount}</Text>
            <Text style={styles.statLabel}>Pods</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <ClipboardList size={18} color={GOLD} />
            </View>
            <Text style={styles.statCount}>{taskCount}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>

        {/* ──────────────── Social links ──────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Social Links</Text>

          {hasSocialLinks ? (
            <>
              {hasInstagram && (
                <SocialRow
                  icon={<Instagram size={16} color={Colors.secondary[500]} />}
                  label="Instagram"
                  value={currentUser.instagram!}
                />
              )}

              {hasInstagram && hasDiscord && <View style={styles.divider} />}

              {hasDiscord && (
                <SocialRow
                  icon={<MessageCircle size={16} color={Colors.secondary[500]} />}
                  label="Discord"
                  value={currentUser.discord!}
                />
              )}
            </>
          ) : (
            <Text style={styles.socialNote}>No social links added yet</Text>
          )}

          {hasSocialLinks && (
            <Text style={styles.socialNote}>
              Social links are only visible to your Pod members
            </Text>
          )}
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
            <View style={styles.menuIconWrap}>
              <Bell size={17} color={Colors.neutral[600]} />
            </View>
            <Text style={styles.menuLabel}>Notifications</Text>
            <ChevronRight size={17} color={Colors.neutral[300]} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <View style={styles.menuIconWrap}>
              <Settings size={17} color={Colors.neutral[600]} />
            </View>
            <Text style={styles.menuLabel}>Account Settings</Text>
            <ChevronRight size={17} color={Colors.neutral[300]} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressedDanger,
            ]}
          >
            <View style={styles.menuIconWrapDanger}>
              <LogOut size={17} color={Colors.error[500]} />
            </View>
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
    backgroundColor: OFF_WHITE,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  /* Header */
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 28,
    lineHeight: 34,
    color: FOREST,
  },

  /* Identity */
  identitySection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
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
    color: Colors.ink,
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

  /* Demo Mode */
  demoModeWrap: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  demoModeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary[400],
  },
  demoModeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.neutral[400],
    letterSpacing: 0.8,
    textTransform: 'uppercase',
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
    gap: 2,
    ...Shadows.sm,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: FOREST,
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
    fontFamily: 'SourceSerifPro-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.ink,
    marginBottom: 0,
  },

  /* Social links */
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  socialIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary[50],
    justifyContent: 'center',
    alignItems: 'center',
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
    marginHorizontal: Spacing.xs,
  },

  /* Privacy */
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 7,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.primary[600],
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
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginHorizontal: -Spacing.xs,
  },
  menuItemPressed: {
    backgroundColor: Colors.neutral[50],
  },
  menuItemPressedDanger: {
    backgroundColor: Colors.error[50],
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconWrapDanger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error[50],
    justifyContent: 'center',
    alignItems: 'center',
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
