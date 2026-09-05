import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Users, MessageSquare, Video, MapPin, Shuffle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { StudyRequest } from '@/constants/mockData';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';

interface StudyRequestCardProps {
  request: StudyRequest;
  onJoin?: (id: string) => void;
}

const preferenceConfig: Record<
  StudyRequest['preference'],
  { label: string; icon: React.ElementType; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'neutral' }
> = {
  'text-only': { label: 'Text Only', icon: MessageSquare, variant: 'neutral' },
  online: { label: 'Online', icon: Video, variant: 'primary' },
  'in-person': { label: 'In Person', icon: MapPin, variant: 'secondary' },
  flexible: { label: 'Flexible', icon: Shuffle, variant: 'success' },
};

export default function StudyRequestCard({ request, onJoin }: StudyRequestCardProps) {
  const pref = preferenceConfig[request.preference];

  return (
    <View style={styles.card}>
      {/* Header: Avatar + Author */}
      <View style={styles.header}>
        <Avatar initials={request.authorInitials} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{request.authorName}</Text>
          <Text style={styles.timestamp}>{request.createdAt}</Text>
        </View>
      </View>

      {/* Topic title */}
      <Text style={styles.topic}>{request.topic}</Text>

      {/* Help needed description */}
      <Text style={styles.helpNeeded}>{request.helpNeeded}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        <Badge label={pref.label} variant={pref.variant} size="sm" />
        <Badge
          label={`Up to ${request.groupSize} people`}
          variant="neutral"
          size="sm"
        />
      </View>

      {/* Availability */}
      <View style={styles.availabilityRow}>
        <Clock size={14} color={Colors.neutral[500]} />
        <Text style={styles.availabilityText}>{request.availability}</Text>
      </View>

      {/* Footer: Interested count + Join button */}
      <View style={styles.footer}>
        <View style={styles.interestedRow}>
          <Users size={14} color={Colors.neutral[500]} />
          <Text style={styles.interestedText}>
            {request.interestedCount} interested
          </Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => onJoin?.(request.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    padding: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerText: {
    marginLeft: Spacing.sm + 4,
    flex: 1,
  },
  authorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.neutral[900],
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[500],
    marginTop: 1,
  },
  topic: {
    fontFamily: 'SourceSerifPro-SemiBold',
    fontSize: 17,
    lineHeight: 22,
    color: Colors.neutral[900],
    marginBottom: Spacing.xs,
  },
  helpNeeded: {
    ...Typography.body,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm + 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm + 4,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  availabilityText: {
    ...Typography.caption,
    color: Colors.neutral[600],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: Spacing.sm + 4,
  },
  interestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interestedText: {
    ...Typography.caption,
    color: Colors.neutral[600],
  },
  joinButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  joinButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
});
