import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from './ui';
import { progressSegments } from '../core/progress';
export function ProgressTrack({
  value,
  goal,
  color,
  label,
  showOverflow = false,
}: {
  value: number;
  goal?: number;
  color: string;
  label: string;
  showOverflow?: boolean;
}) {
  const colors = useTheme();
  const segments = progressSegments(value, goal);
  const target = showOverflow
    ? segments.within
    : Math.min(1, segments.within + segments.excess);
  const progress = useSharedValue(target);
  const excessTarget = showOverflow ? segments.excess : 0;
  const excess = useSharedValue(excessTarget);
  useEffect(() => {
    progress.value = withTiming(target, {
      duration: 420,
      reduceMotion: ReduceMotion.System,
    });
  }, [target, progress]);
  useEffect(() => {
    excess.value = withTiming(excessTarget, {
      duration: 420,
      reduceMotion: ReduceMotion.System,
    });
  }, [excessTarget, excess]);
  const animated = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  const animatedExcess = useAnimatedStyle(() => ({
    width: `${excess.value * 100}%`,
  }));
  return (
    <View
      accessibilityRole={goal ? 'progressbar' : undefined}
      accessibilityLabel={label}
      accessibilityValue={
        goal
          ? {
              min: 0,
              max: Math.max(value, goal),
              now: Math.max(0, value),
              text: `${value} / ${goal}`,
            }
          : undefined
      }
      style={{
        height: 5,
        backgroundColor: colors.line,
        borderRadius: 4,
        overflow: 'hidden',
        flexDirection: 'row',
      }}
    >
      <Animated.View
        style={[{ height: 5, backgroundColor: color }, animated]}
      />
      {showOverflow && (
        <Animated.View
          style={[
            { height: 5, backgroundColor: colors.danger },
            animatedExcess,
          ]}
        />
      )}
    </View>
  );
}
