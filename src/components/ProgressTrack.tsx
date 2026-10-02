import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { useTheme } from './ui';
export function ProgressTrack({
  value,
  goal,
  color,
  label,
}: {
  value: number;
  goal?: number;
  color: string;
  label: string;
}) {
  const colors = useTheme();
  const target = goal && goal > 0 ? Math.max(0, Math.min(1, value / goal)) : 0;
  const progress = useSharedValue(target);
  useEffect(() => {
    progress.value = withTiming(target, {
      duration: 420,
      reduceMotion: ReduceMotion.System,
    });
  }, [target, progress]);
  const animated = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));
  return (
    <View
      accessibilityRole={goal ? 'progressbar' : undefined}
      accessibilityLabel={label}
      accessibilityValue={
        goal
          ? {
              min: 0,
              max: goal,
              now: Math.min(value, goal),
              text: `${value} / ${goal}`,
            }
          : undefined
      }
      style={{
        height: 5,
        backgroundColor: colors.line,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { height: 5, backgroundColor: color, borderRadius: 4 },
          animated,
        ]}
      />
    </View>
  );
}
