import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useDemoUser } from '@/contexts/DemoUserContext';

export default function UserSwitcher() {
  const { currentUser, allProfiles, switchUser } = useDemoUser();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}
      >
        <View style={styles.triggerAvatar}>
          <Text style={styles.triggerAvatarText}>{currentUser.initials}</Text>
        </View>
        <View style={styles.triggerInfo}>
          <Text style={styles.triggerName} numberOfLines={1}>
            {currentUser.name}
          </Text>
          <Text style={styles.triggerLabel}>Demo User</Text>
        </View>
        <ChevronDown size={16} color={Colors.neutral[400]} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Switch Demo User</Text>
            {allProfiles.map((profile) => {
              const isActive = profile.id === currentUser.id;
              return (
                <Pressable
                  key={profile.id}
                  onPress={() => {
                    switchUser(profile.id);
                    setVisible(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    isActive && styles.optionActive,
                    pressed && styles.optionPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.optionAvatar,
                      isActive && styles.optionAvatarActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionAvatarText,
                        isActive && styles.optionAvatarTextActive,
                      ]}
                    >
                      {profile.initials}
                    </Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{profile.name}</Text>
                    <Text style={styles.optionDetail}>
                      {profile.year} · {profile.major}
                    </Text>
                  </View>
                  {isActive && (
                    <Check size={18} color={Colors.primary[500]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}









const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm + 2,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  triggerPressed: { opacity: 0.7 },
  triggerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.neutral[0],
  },
  triggerInfo: { marginRight: 2 },
  triggerName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.neutral[800],
  },
  triggerLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    lineHeight: 13,
    color: Colors.neutral[400],
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  sheetTitle: {
    ...Typography.h3,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  optionActive: {
    backgroundColor: Colors.primary[50],
  },
  optionPressed: { opacity: 0.7 },
  optionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionAvatarActive: {
    backgroundColor: Colors.primary[500],
  },
  optionAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[600],
  },
  optionAvatarTextActive: {
    color: Colors.neutral[0],
  },
  optionInfo: { flex: 1 },
  optionName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.neutral[900],
  },
  optionDetail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[500],
  },
});
