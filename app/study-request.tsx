import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  X,
  Send,
  MessageSquare,
  Video,
  MapPin,
  Shuffle,
  Check,
  Circle,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { HELP_TYPE_OPTIONS } from '@/constants/mockData';
import type { HelpType } from '@/constants/mockData';
import { useCourses, useCreateStudyRequest, useSaveAvailabilityBlocks } from '@/hooks/useStudyData';
import AvailabilityPicker, { getAvailabilitySummary, isMinimumAvailability } from '@/components/AvailabilityPicker';
import type { AvailabilityBlock } from '@/components/AvailabilityPicker';

const COLLAB_ICONS: Record<string, React.ElementType> = {
  'text-only': MessageSquare,
  online: Video,
  'in-person': MapPin,
  flexible: Shuffle,
};

const COLLAB_PREFS = [
  { key: 'text-only', label: 'Text Only' },
  { key: 'online', label: 'Online' },
  { key: 'in-person', label: 'In Person' },
  { key: 'flexible', label: 'Flexible' },
];

const GROUP_SIZE_OPTIONS = [
  { key: 2, label: 'One partner' },
  { key: 4, label: 'Small pod (3-5)' },
];

export default function StudyRequestScreen() {
  const router = useRouter();
  const { courseId, prefillCourseId, prefillTopic, prefillGoal } = useLocalSearchParams<{
    courseId?: string;
    prefillCourseId?: string;
    prefillTopic?: string;
    prefillGoal?: string;
  }>();
  const { width } = useWindowDimensions();
  const { data: courses } = useCourses();
  const createStudyRequest = useCreateStudyRequest();
  const saveAvailabilityBlocks = useSaveAvailabilityBlocks();

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(prefillCourseId ?? courseId ?? null);
  const [selectedHelpType, setSelectedHelpType] = useState<HelpType | null>(prefillTopic ? 'understand-concept' : null);
  const [topic, setTopic] = useState(prefillTopic ? `${prefillTopic}${prefillGoal ? ` (from: ${prefillGoal})` : ''}` : '');
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [isFlexible, setIsFlexible] = useState(false);
  const [selectedPreference, setSelectedPreference] = useState<string | null>(null);
  const [groupSize, setGroupSize] = useState<number | null>(null);
  const [postToHub, setPostToHub] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const checkScale = useRef(new Animated.Value(0)).current;

  const isFormValid =
    selectedCourseId !== null &&
    selectedHelpType !== null &&
    topic.trim().length > 0 &&
    isMinimumAvailability(availabilityBlocks, isFlexible);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    const helpTypeLabel =
      HELP_TYPE_OPTIONS.find((opt) => opt.key === selectedHelpType)?.label ?? '';
    const availSummary = isFlexible
      ? 'Flexible schedule'
      : getAvailabilitySummary(availabilityBlocks);

    setIsSubmitting(true);

    try {
      const requestId = await createStudyRequest({
        courseId: selectedCourseId!,
        helpType: selectedHelpType!,
        helpNeeded: helpTypeLabel,
        topic: topic.trim(),
        availability: availSummary,
        preference: selectedPreference ?? 'flexible',
        groupSize: groupSize ?? 2,
        postToHub,
      });

      // Save availability blocks linked to this study request
      if (!isFlexible && availabilityBlocks.length > 0) {
        await saveAvailabilityBlocks(
          availabilityBlocks.map((b) => ({ day: b.day, startTime: b.startTime, endTime: b.endTime })),
          requestId,
        );
      }

      setIsSubmitted(true);

      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err) {
      console.error('Failed to create study request:', err);
      setIsSubmitting(false);
    }
  };

  // Responsive container width
  const containerMaxWidth = width > 600 ? 600 : undefined;

  if (isSubmitted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successCheckCircle,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            <Check size={40} color={Colors.neutral[0]} strokeWidth={3} />
          </Animated.View>
          <Text style={styles.successTitle}>Request Posted!</Text>
          <Text style={styles.successSubtitle}>
            Your classmates can now find and respond to your study request.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.headerInner,
              containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center' as const, width: '100%' } : undefined,
            ]}
          >
            <Text style={styles.headerTitle}>New Study Request</Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
              hitSlop={8}
            >
              <X size={22} color={Colors.neutral[700]} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            containerMaxWidth
              ? { maxWidth: containerMaxWidth, alignSelf: 'center' as const, width: '100%' }
              : undefined,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Course Selector ── */}
          <View style={styles.section}>
            <Text style={styles.label}>COURSE</Text>
            <View style={styles.chipRow}>
              {courses.map((course) => {
                const isSelected = selectedCourseId === course.id;
                return (
                  <Pressable
                    key={course.id}
                    onPress={() => setSelectedCourseId(course.id)}
                    style={[
                      styles.chip,
                      isSelected ? styles.chipSelected : styles.chipUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                      ]}
                    >
                      {course.code}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Help Type Selector ── */}
          <View style={styles.section}>
            <Text style={styles.label}>WHAT DO YOU NEED HELP WITH TODAY?</Text>
            <View style={styles.helpTypeList}>
              {HELP_TYPE_OPTIONS.map((option) => {
                const isSelected = selectedHelpType === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSelectedHelpType(option.key)}
                    style={[
                      styles.helpTypeRow,
                      isSelected
                        ? styles.helpTypeRowSelected
                        : styles.helpTypeRowUnselected,
                    ]}
                  >
                    <View style={styles.helpTypeIndicator}>
                      {isSelected ? (
                        <CheckCircle2
                          size={22}
                          color={Colors.primary[500]}
                          fill={Colors.primary[500]}
                        />
                      ) : (
                        <Circle size={22} color={Colors.neutral[300]} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.helpTypeText,
                        isSelected
                          ? styles.helpTypeTextSelected
                          : styles.helpTypeTextUnselected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Topic ── */}
          <View style={styles.section}>
            <Text style={styles.label}>SPECIFIC TOPIC OR GOAL</Text>
            <TextInput
              style={[
                styles.textInput,
                Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {},
              ]}
              placeholder="e.g., AVL tree rotations, eigenvalue decomposition"
              placeholderTextColor={Colors.neutral[400]}
              value={topic}
              onChangeText={setTopic}
            />
          </View>

          {/* ── Availability Picker ── */}
          <View style={styles.section}>
            <Text style={styles.label}>WHEN ARE YOU AVAILABLE?</Text>
            <AvailabilityPicker
              selectedBlocks={availabilityBlocks}
              onBlocksChange={setAvailabilityBlocks}
              isFlexible={isFlexible}
              onFlexibleChange={setIsFlexible}
            />
          </View>

          {/* ── Collaboration Preference ── */}
          <View style={styles.section}>
            <Text style={styles.label}>HOW DO YOU WANT TO COLLABORATE?</Text>
            <View style={styles.collabGrid}>
              {COLLAB_PREFS.map((pref) => {
                const isSelected = selectedPreference === pref.key;
                const IconComponent = COLLAB_ICONS[pref.key] ?? Shuffle;
                return (
                  <Pressable
                    key={pref.key}
                    onPress={() => setSelectedPreference(pref.key)}
                    style={[
                      styles.collabCard,
                      isSelected
                        ? styles.collabCardSelected
                        : styles.collabCardUnselected,
                    ]}
                  >
                    <IconComponent
                      size={22}
                      color={
                        isSelected ? Colors.primary[500] : Colors.neutral[400]
                      }
                    />
                    <Text
                      style={[
                        styles.collabCardText,
                        isSelected
                          ? styles.collabCardTextSelected
                          : styles.collabCardTextUnselected,
                      ]}
                    >
                      {pref.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Group Size ── */}
          <View style={styles.section}>
            <Text style={styles.label}>DESIRED GROUP SIZE</Text>
            <View style={styles.groupSizeRow}>
              {GROUP_SIZE_OPTIONS.map((option) => {
                const isSelected = groupSize === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setGroupSize(option.key)}
                    style={[
                      styles.groupSizeCard,
                      isSelected
                        ? styles.groupSizeCardSelected
                        : styles.groupSizeCardUnselected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupSizeCardText,
                        isSelected
                          ? styles.groupSizeCardTextSelected
                          : styles.groupSizeCardTextUnselected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Post to Course Hub Toggle ── */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Post to Course Hub?</Text>
                <Text style={styles.toggleDescription}>
                  Your request will be visible to classmates in the course group
                  chat
                </Text>
              </View>
              <Pressable
                onPress={() => setPostToHub((prev) => !prev)}
                style={[
                  styles.toggleTrack,
                  postToHub ? styles.toggleTrackOn : styles.toggleTrackOff,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    postToHub ? styles.toggleThumbOn : styles.toggleThumbOff,
                  ]}
                />
              </Pressable>
            </View>
          </View>

          {/* Bottom spacing for the button */}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* ── Submit Button ── */}
        <View
          style={[
            styles.submitContainer,
            containerMaxWidth
              ? { maxWidth: containerMaxWidth, alignSelf: 'center' as const, width: '100%' }
              : undefined,
          ]}
        >
          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            style={({ pressed }) => [
              styles.submitButton,
              (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
              pressed && isFormValid && !isSubmitting && styles.submitButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.neutral[0]} />
            ) : (
              <Send size={18} color={Colors.neutral[0]} />
            )}
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Posting…' : 'Post Study Request'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  /* ── Success State ── */
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  successCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 24,
    color: Colors.primary[500],
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    ...Typography.body,
    color: Colors.neutral[500],
    textAlign: 'center',
    maxWidth: 280,
  },

  /* ── Header ── */
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral[200],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: Colors.primary[500],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonPressed: {
    backgroundColor: Colors.neutral[200],
  },

  /* ── Form scroll ── */
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  /* ── Sections ── */
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
    color: Colors.neutral[600],
    textTransform: 'uppercase',
    marginBottom: Spacing.sm + 2,
  },

  /* ── Course Chips ── */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  chipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.neutral[300],
  },
  chipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 18,
  },
  chipTextSelected: {
    color: Colors.neutral[0],
  },
  chipTextUnselected: {
    color: Colors.neutral[700],
  },

  /* ── Help Type Selector ── */
  helpTypeList: {
    gap: Spacing.sm,
  },
  helpTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  helpTypeRowSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  helpTypeRowUnselected: {
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.surface,
  },
  helpTypeIndicator: {
    marginRight: Spacing.sm + 2,
  },
  helpTypeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  helpTypeTextSelected: {
    color: Colors.primary[500],
  },
  helpTypeTextUnselected: {
    color: Colors.neutral[700],
  },

  /* ── Text Inputs ── */
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.neutral[900],
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm + 4 : 0,
    gap: Spacing.sm,
  },
  inputWithIconText: {
    flex: 1,
    ...Typography.body,
    color: Colors.neutral[900],
    paddingVertical: Platform.OS === 'android' ? Spacing.sm + 4 : 0,
  },

  /* ── Collaboration Grid ── */
  collabGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 2,
  },
  collabCard: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  collabCardSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  collabCardUnselected: {
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.surface,
  },
  collabCardText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  collabCardTextSelected: {
    color: Colors.primary[500],
  },
  collabCardTextUnselected: {
    color: Colors.neutral[500],
  },

  /* ── Group Size ── */
  groupSizeRow: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
  },
  groupSizeCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  groupSizeCardSelected: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  groupSizeCardUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.neutral[300],
  },
  groupSizeCardText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  groupSizeCardTextSelected: {
    color: Colors.neutral[0],
  },
  groupSizeCardTextUnselected: {
    color: Colors.neutral[700],
  },

  /* ── Toggle ── */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    lineHeight: 22,
    color: Colors.neutral[900],
  },
  toggleDescription: {
    ...Typography.caption,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  toggleTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  toggleTrackOn: {
    backgroundColor: Colors.primary[500],
  },
  toggleTrackOff: {
    backgroundColor: Colors.neutral[300],
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral[0],
    ...Shadows.sm,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  toggleThumbOff: {
    alignSelf: 'flex-start',
  },

  /* ── Submit ── */
  submitContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral[200],
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    ...Shadows.sm,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.neutral[0],
  },
});
