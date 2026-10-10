import React from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { motion } from './motion';
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
  const excessTarget = showOverflow ? segments.excess : 0;
  const reduced = useReducedMotion();
  const transition = {
    transitionProperty: ['width', 'left'] as ('width' | 'left')[],
    transitionDuration: reduced ? 0 : motion.state,
    transitionTimingFunction: motion.cssEaseOut,
  };
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
      }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${target * 100}%`,
            backgroundColor: color,
          },
          transition,
        ]}
      />
      {showOverflow && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: `${target * 100}%`,
              top: 0,
              bottom: 0,
              width: `${excessTarget * 100}%`,
              backgroundColor: colors.danger,
            },
            transition,
          ]}
        />
      )}
    </View>
  );
}
