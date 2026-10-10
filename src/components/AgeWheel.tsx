import { scheduleOnRN } from 'react-native-worklets';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
  useReducedMotion,
  useAnimatedScrollHandler,
  useAnimatedReaction,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { feedback } from './feedback';
import { fonts, useTheme } from './ui';
const ages = Array.from({ length: 83 }, (_, i) => i + 18);
function WheelNumber({
  age,
  index,
  offset,
  height,
  onSelect,
  reduced,
}: {
  age: number;
  index: number;
  offset: SharedValue<number>;
  height: number;
  onSelect: () => void;
  reduced: boolean;
}) {
  const colors = useTheme();
  const style = useAnimatedStyle(() => {
    const distance = (index * height - offset.get()) / height;
    return {
      color: Math.abs(distance) < 0.5 ? colors.primary : colors.muted,
      opacity: interpolate(
        Math.abs(distance),
        [0, 1, 2],
        [1, 0.45, 0.12],
        Extrapolation.CLAMP,
      ),
      transform: reduced
        ? []
        : [
            { perspective: 500 },
            {
              rotateX: `${interpolate(distance, [-2, 0, 2], [55, 0, -55], Extrapolation.CLAMP)}deg`,
            },
            {
              scale: interpolate(
                Math.abs(distance),
                [0, 2],
                [1, 0.7],
                Extrapolation.CLAMP,
              ),
            },
          ],
    };
  });
  return (
    <Pressable
      accessible={false}
      onPress={onSelect}
      style={{ height, justifyContent: 'center', alignItems: 'center' }}
    >
      <Animated.Text
        style={[
          {
            fontFamily: fonts.display,
            fontSize: 40,
            lineHeight: height,
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
          },
          style,
        ]}
      >
        {age}
      </Animated.Text>
    </Pressable>
  );
}
export function AgeWheel({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}) {
  const colors = useTheme();
  const { fontScale } = useWindowDimensions();
  const height = Math.ceil(56 * Math.max(1, fontScale));
  const initial = value ?? 30;
  const offset = useSharedValue((initial - 18) * height);
  const ref = useRef<ScrollView>(null);
  const dragging = useSharedValue(false);
  const selected = useRef(initial);
  // Keep the native initial position stable across controlled value updates.
  const [initialOffset] = useState(() => ({
    x: 0,
    y: (initial - 18) * height,
  }));
  const rowHeight = useRef(height);
  const [preview, setPreview] = useState(initial);
  const reduced = useReducedMotion();
  useEffect(() => {
    const next = value ?? 30;
    if (rowHeight.current !== height || selected.current !== next) {
      const y = (next - 18) * height;
      ref.current?.scrollTo({ y, animated: false });
      offset.set(y);
      rowHeight.current = height;
      selected.current = next;
      setPreview(next);
    }
  }, [value, height, offset]);
  const commit = useCallback(
    (age: number) => {
      if (disabled || age === selected.current) return;
      selected.current = age;
      setPreview(age);
      onChange(age);
    },
    [disabled, onChange],
  );
  const scrolling = useAnimatedScrollHandler({
    onScroll: (event) => {
      offset.set(event.contentOffset.y);
    },
    onBeginDrag: () => {
      dragging.set(true);
    },
  });
  useAnimatedReaction(
    () => Math.min(100, Math.max(18, 18 + Math.round(offset.get() / height))),
    (age, previous) => {
      if (previous !== null && age !== previous && dragging.get())
        scheduleOnRN(feedback);
    },
  );
  function settle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = event.nativeEvent.contentOffset.y;
    offset.set(y);
    commit(Math.min(100, Math.max(18, 18 + Math.round(y / height))));
  }
  function choose(age: number, animate = true) {
    if (disabled) return;
    ref.current?.scrollTo({
      y: (age - 18) * height,
      animated: animate && !reduced,
    });
    setPreview(age);
    if (age !== selected.current) {
      feedback();
      selected.current = age;
    }
    onChange(age);
  }
  return (
    <View style={{ marginVertical: 12 }}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min: 18,
          max: 100,
          now: value ?? preview,
          text: String(value ?? preview),
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          choose(
            Math.min(
              100,
              Math.max(
                18,
                (value ?? preview) +
                  (e.nativeEvent.actionName === 'increment' ? 1 : -1),
              ),
            ),
          )
        }
        style={{ height: height * 5, overflow: 'hidden' }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 28,
            right: 28,
            top: height * 2,
            height,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.tint,
            borderRadius: 12,
          }}
        />
        <Animated.ScrollView
          testID="age-wheel-scroll"
          ref={ref}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          scrollEnabled={!disabled}
          snapToInterval={height}
          decelerationRate="fast"
          bounces={false}
          scrollEventThrottle={16}
          onScroll={scrolling}
          onMomentumScrollEnd={(event) => {
            dragging.set(false);
            settle(event);
          }}
          onScrollEndDrag={(event) => {
            dragging.set(false);
            settle(event);
          }}
          contentOffset={initialOffset}
          contentContainerStyle={{ paddingVertical: height * 2 }}
        >
          {ages.map((age, index) => (
            <WheelNumber
              key={age}
              age={age}
              index={index}
              offset={offset}
              height={height}
              reduced={reduced}
              onSelect={() => choose(age)}
            />
          ))}
        </Animated.ScrollView>
        <LinearGradient
          pointerEvents="none"
          colors={[colors.bg, `${colors.bg}00`]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={[`${colors.bg}00`, colors.bg]}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height }}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} −1`}
          disabled={disabled || (value ?? preview) <= 18}
          onPress={() => choose(Math.max(18, (value ?? preview) - 1))}
          style={{
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 24 }}>−</Text>
        </Pressable>
        <Text
          style={{
            fontFamily: fonts.medium,
            color: colors.muted,
            fontSize: 15,
          }}
        >
          {value ?? preview}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} +1`}
          disabled={disabled || (value ?? preview) >= 100}
          onPress={() => choose(Math.min(100, (value ?? preview) + 1))}
          style={{
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 24 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}
