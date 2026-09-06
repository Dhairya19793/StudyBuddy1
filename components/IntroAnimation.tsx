import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

const INK = '#193326';
const FOREST = '#2F6B45';
const SAGE = '#E7EFE8';
const BG = '#F8F6F0';
const GOLD = '#D4A72C';
const SECONDARY_TEXT = '#81796F';

const NODE_POSITIONS = [
  { x: -60, y: -50 },
  { x: 50, y: -40 },
  { x: -40, y: 30 },
  { x: 55, y: 45 },
  { x: 0, y: -70 },
  { x: -70, y: 0 },
  { x: 70, y: 5 },
];

const CENTER_X = 0;
const CENTER_Y = -10;

interface Props {
  onFinish: () => void;
}

export default function IntroAnimation({ onFinish }: Props) {
  const progress = useSharedValue(0);
  const fadeOut = useSharedValue(1);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.isReduceMotionEnabled().then((v) => {
        if (v) {
          setReducedMotion(true);
          onFinish();
        }
      });
    }
  }, [onFinish]);

  useEffect(() => {
    if (reducedMotion) return;

    progress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }, 1300);

    return () => clearTimeout(timer);
  }, [reducedMotion, progress, fadeOut, onFinish]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  if (reducedMotion) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        {/* Animated nodes */}
        <View style={styles.nodeField}>
          {NODE_POSITIONS.map((pos, i) => (
            <AnimatedNode
              key={i}
              startX={pos.x}
              startY={pos.y}
              endX={CENTER_X + (pos.x * 0.3)}
              endY={CENTER_Y + (pos.y * 0.3)}
              progress={progress}
              delay={i * 40}
              index={i}
            />
          ))}
          {/* Central glow */}
          <Animated.View
            style={[
              styles.centerGlow,
              useAnimatedStyle(() => ({
                opacity: interpolate(progress.value, [0.3, 0.8], [0, 0.6]),
                transform: [{ scale: interpolate(progress.value, [0.3, 1], [0.5, 1]) }],
              })),
            ]}
          />
        </View>

        {/* Wordmark */}
        <Animated.Text
          style={[
            styles.wordmark,
            useAnimatedStyle(() => ({
              opacity: interpolate(progress.value, [0, 0.3], [0, 1]),
              transform: [
                { translateY: interpolate(progress.value, [0, 0.3], [12, 0]) },
              ],
            })),
          ]}
        >
          StudyMode
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            useAnimatedStyle(() => ({
              opacity: interpolate(progress.value, [0.3, 0.6], [0, 1]),
              transform: [
                { translateY: interpolate(progress.value, [0.3, 0.6], [8, 0]) },
              ],
            })),
          ]}
        >
          Find your people. Find your focus.
        </Animated.Text>
      </View>

      {/* Skip */}
      <Pressable style={styles.skipBtn} onPress={onFinish} hitSlop={16}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </Animated.View>
  );
}

function AnimatedNode({
  startX,
  startY,
  endX,
  endY,
  progress,
  delay,
  index,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: SharedValue<number>;
  delay: number;
  index: number;
}) {
  const size = 10 + (index % 3) * 4;
  const isGold = index % 3 === 1;

  const style = useAnimatedStyle(() => {
    const t = progress.value;
    const x = interpolate(t, [0, 1], [startX, endX]);
    const y = interpolate(t, [0, 1], [startY, endY]);
    const opacity = interpolate(t, [0, 0.15], [0, 0.85]);
    const scale = interpolate(t, [0, 0.5, 1], [0.4, 1.1, 0.9]);
    return {
      opacity,
      transform: [{ translateX: x }, { translateY: y }, { scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.node,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isGold ? GOLD : FOREST,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  nodeField: {
    width: 180,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  node: {
    position: 'absolute',
  },
  centerGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SAGE,
  },
  wordmark: {
    fontFamily: 'SourceSerifPro-Bold',
    fontSize: 36,
    lineHeight: 44,
    color: INK,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: SECONDARY_TEXT,
    letterSpacing: 0.2,
  },
  skipBtn: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: SECONDARY_TEXT,
  },
});
