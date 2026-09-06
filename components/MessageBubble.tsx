import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Message } from '@/constants/mockData';
import Avatar from '@/components/Avatar';

interface MessageBubbleProps {
  message: Message;
  onViewRequest?: (studyRequestId: string) => void;
}
//creates the message layout
export default function MessageBubble({ message, onViewRequest }: MessageBubbleProps) {
  const isOwn = message.isOwn === true;

  // Study request card-style bubble
  if (message.isStudyRequest) {
    return (
      <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
        {!isOwn && (
          <Avatar initials={message.authorInitials} size={30} />
        )}
        <View
          style={[
            styles.studyRequestBubble,
            isOwn ? styles.studyRequestOwn : styles.studyRequestOther,
          ]}
        >
          <View style={styles.studyRequestHeader}>
            <BookOpen size={14} color={Colors.primary[500]} />
            <Text style={styles.studyRequestLabel}>Study Request</Text>
          </View>
          {!isOwn && (
            <Text style={styles.studyRequestAuthor}>{message.authorName}</Text>
          )}
          <Text style={styles.studyRequestText}>{message.text}</Text>
          <TouchableOpacity
            style={styles.viewRequestButton}
            onPress={() => onViewRequest?.(message.studyRequestId ?? '')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewRequestText}>View Request</Text>
          </TouchableOpacity>
          <Text style={[styles.timestamp, styles.timestampStudy]}>
            {message.timestamp}
          </Text>
        </View>
      </View>
    );
  }

  // Standard message bubble
  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <Avatar initials={message.authorInitials} size={30} />
      )}
      <View style={styles.bubbleWrapper}>
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleOwn : styles.bubbleOther,
          ]}
        >
          {!isOwn && (
            <Text style={styles.authorName}>{message.authorName}</Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
            {message.text}
          </Text>
        </View>
        <Text
          style={[
            styles.timestamp,
            isOwn ? styles.timestampOwn : styles.timestampOther,
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

//style choices for the message

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubbleWrapper: {
    maxWidth: '75%',
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.sm + 2,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary[500],
    borderBottomRightRadius: BorderRadius.sm / 2,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: BorderRadius.sm / 2,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  authorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary[600],
    marginBottom: 2,
  },
  messageText: {
    ...Typography.body,
    color: Colors.neutral[900],
  },
  messageTextOwn: {
    color: '#FFFFFF',
  },
  timestamp: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 14,
    color: Colors.neutral[400],
    marginTop: Spacing.xs,
  },
  timestampOwn: {
    textAlign: 'right',
  },
  timestampOther: {
    textAlign: 'left',
  },

  // Study request bubble
  studyRequestBubble: {
    maxWidth: '75%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.sm + 4,
    ...Shadows.sm,
  },
  studyRequestOwn: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  studyRequestOther: {
    backgroundColor: Colors.surface,
    borderColor: Colors.secondary[200],
  },
  studyRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  studyRequestLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  studyRequestAuthor: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.neutral[700],
    marginBottom: 2,
  },
  studyRequestText: {
    ...Typography.body,
    color: Colors.neutral[800],
    marginBottom: Spacing.sm,
  },
  viewRequestButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  viewRequestText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  timestampStudy: {
    textAlign: 'right',
  },
});
