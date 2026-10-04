import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { feedback } from './feedback';
import { fonts, useTheme } from './ui';
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const colors = useTheme();
  const [width, setWidth] = useState(0);
  const index = options.findIndex((option) => option.value === value);
  const x = useSharedValue(0);
  const cell = width / options.length;
  useEffect(() => {
    x.value = withTiming(Math.max(0, index) * cell, {
      duration: 240,
      reduceMotion: ReduceMotion.System,
    });
  }, [index, cell, x]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));
  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - 8)}
      style={{
        padding: 4,
        backgroundColor: colors.tint,
        borderRadius: 16,
        flexDirection: 'row',
      }}
    >
      {index >= 0 && width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: 4,
              width: cell,
              backgroundColor: colors.primary,
              borderRadius: 12,
            },
            style,
          ]}
        />
      )}
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={option.label}
          accessibilityState={{ selected: value === option.value, disabled }}
          disabled={disabled}
          onPress={() => {
            if (value !== option.value) feedback();
            onChange(option.value);
          }}
          style={{
            flex: 1,
            paddingHorizontal: 8,
            paddingVertical: 14,
            minHeight: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 15,
              textAlign: 'center',
              color: value === option.value ? colors.onPrimary : colors.primary,
            }}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
