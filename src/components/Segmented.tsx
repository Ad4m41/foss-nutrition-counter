import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { PressFeedback } from './PressFeedback';
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
  const cell = options.length ? width / options.length : 0;
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
        <View
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
            { transform: [{ translateX: Math.max(0, index) * cell }] },
          ]}
        />
      )}
      {options.map((option) => (
        <PressFeedback
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
        </PressFeedback>
      ))}
    </View>
  );
}
