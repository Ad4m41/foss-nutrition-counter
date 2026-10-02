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
  useAnimatedScrollHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
  useReducedMotion,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { fonts, useTheme } from './ui';
const ages = Array.from({ length: 83 }, (_, i) => i + 18);
function WheelNumber({
  age,
  index,
  offset,
  height,
  selected,
  onSelect,
  reduced,
}: {
  age: number;
  index: number;
  offset: SharedValue<number>;
  height: number;
  selected: boolean;
  onSelect: () => void;
  reduced: boolean;
}) {
  const colors = useTheme();
  const style = useAnimatedStyle(() => {
    const distance = (index * height - offset.value) / height;
    return {
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
            color: selected ? colors.primary : colors.muted,
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
  const initialized = useSharedValue(false);
  const selected = useRef(initial);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );
  const rowHeight = useRef(0);
  const [preview, setPreview] = useState(initial);
  const reduced = useReducedMotion();
  const scrolling = useAnimatedScrollHandler((event) => {
    offset.value = event.contentOffset.y;
  });
  useEffect(() => {
    const next = value ?? 30;
    if (rowHeight.current !== height || selected.current !== next) {
      ref.current?.scrollTo({ y: (next - 18) * height, animated: false });
      rowHeight.current = height;
      selected.current = next;
    }
  }, [value, height]);
  const commit = useCallback(
    (age: number) => {
      if (disabled || age === selected.current) return;
      selected.current = age;
      setPreview(age);
      onChange(age);
      void Haptics.selectionAsync().catch(() => {});
    },
    [disabled, onChange],
  );
  useAnimatedReaction(
    () =>
      initialized.value
        ? Math.min(100, Math.max(18, 18 + Math.round(offset.value / height)))
        : null,
    (age, previous) => {
      if (age !== null && previous !== null && age !== previous)
        scheduleOnRN(commit, age);
    },
  );
  function choose(age: number, animate = true) {
    if (disabled) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    ref.current?.scrollTo({
      y: (age - 18) * height,
      animated: animate && !reduced,
    });
    setPreview(age);
    if (age !== selected.current) {
      void Haptics.selectionAsync().catch(() => {});
      selected.current = age;
    }
    onChange(age);
  }
  function settle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const age = Math.min(
      100,
      Math.max(18, 18 + Math.round(event.nativeEvent.contentOffset.y / height)),
    );
    choose(age, false);
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
          ref={ref}
          onContentSizeChange={() => {
            const y = (selected.current - 18) * height;
            ref.current?.scrollTo({ y, animated: false });
            offset.set(y);
            initialized.set(true);
          }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          scrollEnabled={!disabled}
          snapToInterval={height}
          decelerationRate="fast"
          bounces={false}
          scrollEventThrottle={16}
          onScroll={scrolling}
          onMomentumScrollEnd={settle}
          onMomentumScrollBegin={() => {
            if (settleTimer.current) clearTimeout(settleTimer.current);
          }}
          onScrollEndDrag={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            if (settleTimer.current) clearTimeout(settleTimer.current);
            settleTimer.current = setTimeout(() => {
              choose(
                Math.min(100, Math.max(18, 18 + Math.round(y / height))),
                false,
              );
            }, 120);
          }}
          contentOffset={{ x: 0, y: (initial - 18) * height }}
          contentContainerStyle={{ paddingVertical: height * 2 }}
        >
          {ages.map((age, index) => (
            <WheelNumber
              key={age}
              age={age}
              index={index}
              offset={offset}
              height={height}
              selected={(value ?? preview) === age}
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
