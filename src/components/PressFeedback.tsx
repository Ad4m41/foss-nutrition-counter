import React, { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { feedback } from './feedback';
import { motion } from './motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A single press treatment, with no gesture or per-frame React updates. */
export function PressFeedback({
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  haptic,
  ...props
}: PressableProps & { haptic?: 'press' | 'selection' }) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  const active = pressed && !disabled;
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      pressRetentionOffset={props.pressRetentionOffset ?? 16}
      onPressIn={(event) => {
        if (disabled) return;
        setPressed(true);
        if (haptic) feedback(haptic);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        typeof style === 'function' ? style({ pressed: active }) : style,
        {
          transform: [{ scale: active && !reduced ? 0.97 : 1 }],
          transitionProperty: 'transform',
          transitionDuration: reduced ? 0 : motion.press,
          transitionTimingFunction: motion.cssEaseOut,
        },
      ]}
    >
      {typeof children === 'function'
        ? children({ pressed: active })
        : children}
    </AnimatedPressable>
  );
}
