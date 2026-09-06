import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
}



const variantStyles: Record<BadgeVariant, { backgroundColor: string; color: string }> = {
  primary: {

    backgroundColor: Colors.primary[50],
    color: Colors.primary[700],
  },
  secondary: {

    backgroundColor: Colors.secondary[50],
    color: Colors.secondary[700],
  },
  success: {
    
    backgroundColor: Colors.success[50],
    color: Colors.success[600],
  },
  warning: {

    backgroundColor: Colors.warning[50],
    color: Colors.warning[600],
  },
  neutral: {
    backgroundColor: Colors.neutral[100],
    color: Colors.neutral[600],
  },
};




export default function Badge({ label, variant = 'neutral', size = 'md' }: BadgeProps) {
  const colors = variantStyles[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.backgroundColor },
        isSmall ? styles.containerSm : styles.containerMd,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: colors.color },
          isSmall ? styles.labelSm : styles.labelMd,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
  },
  containerSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  containerMd: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
  },
  label: {
    fontFamily: 'Inter-Medium',
  },
  labelSm: {
    fontSize: 10,
    lineHeight: 14,
  },
  labelMd: {
    fontSize: 12,
    lineHeight: 16,
  },
});
