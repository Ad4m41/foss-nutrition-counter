import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { feedback } from './feedback';
import { fonts, useTheme } from './ui';

export function SettingsSectionBar({
  value,
  onChange,
  disabled,
}: {
  value: 'account' | 'app';
  onChange: (value: 'account' | 'app') => void;
  disabled: boolean;
}) {
  const { t } = useApp();
  const colors = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          maxWidth: 560,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        {(['account', 'app'] as const).map((section) => (
          <Pressable
            key={section}
            accessibilityRole="tab"
            accessibilityLabel={
              section === 'account' ? t.accountTab : t.appSettingsTab
            }
            accessibilityState={{ selected: value === section, disabled }}
            disabled={disabled}
            onPress={() => {
              if (value !== section) feedback();
              onChange(section);
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 48,
              flexDirection: 'row',
              gap: 6,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name={
                section === 'account' ? 'person-outline' : 'options-outline'
              }
              size={16}
              color={value === section ? colors.primary : colors.muted}
            />
            <Text
              style={{
                fontFamily: value === section ? fonts.bold : fonts.medium,
                fontSize: 12,
                color: value === section ? colors.primary : colors.muted,
              }}
            >
              {section === 'account' ? t.accountTab : t.appSettingsTab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
