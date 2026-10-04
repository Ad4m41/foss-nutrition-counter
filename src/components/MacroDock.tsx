import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { feedback } from './feedback';
import { router } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { type Nutrients } from '../core/nutrition';
import { ProgressTrack } from './ProgressTrack';
import { fonts, useTheme } from './ui';
export function MacroDock({
  day,
  value,
  blurTarget,
}: {
  day: string;
  value: Nutrients;
  blurTarget: React.RefObject<View | null>;
}) {
  const { settings, t } = useApp();
  const colors = useTheme();
  const dark = useColorScheme() === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.nutritionDetails}
      accessibilityHint={`${Math.round(value.kcal)} ${t.kcal}, ${t.protein} ${value.protein} g, ${t.carbs} ${value.carbs} g, ${t.fat} ${value.fat} g`}
      onPress={() => {
        feedback('press');
        router.push({ pathname: '/nutrition', params: { day } });
      }}
      style={({ pressed }) => ({
        overflow: 'hidden',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 9,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <BlurView
        pointerEvents="none"
        blurTarget={blurTarget}
        blurMethod="dimezisBlurViewSdk31Plus"
        intensity={18}
        tint={dark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: dark ? '#202A23CC' : '#FFFFFFCC' },
        ]}
      />
      <View
        style={{
          flexDirection: 'row',
          gap: 12,
          width: '100%',
          maxWidth: 560,
          alignSelf: 'center',
        }}
      >
        {(['kcal', 'protein', 'carbs', 'fat'] as const).map((key) => {
          const goal =
            key === 'kcal' ? settings.goal : settings.macroGoals?.[key];
          const color = key === 'kcal' ? colors.energy : colors[key];
          return (
            <View key={key} style={{ flex: 1, gap: 3 }}>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 11,
                  color: colors.muted,
                }}
              >
                {key === 'carbs' ? t.shortCarbs : t[key]}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 16,
                  color: colors.text,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {Math.round(value[key] * (key === 'kcal' ? 1 : 10)) /
                  (key === 'kcal' ? 1 : 10)}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 10,
                  color: colors.muted,
                }}
              >
                {goal
                  ? `/ ${goal} ${key === 'kcal' ? 'kcal' : 'g'}`
                  : key === 'kcal'
                    ? 'kcal'
                    : 'g'}
                {goal && value[key] > goal ? (
                  <Text
                    style={{ color: colors.danger }}
                  >{` · +${Math.round((value[key] - goal) * 10) / 10}`}</Text>
                ) : null}
              </Text>
              <ProgressTrack
                value={value[key]}
                goal={goal}
                color={color}
                label={t[key]}
                showOverflow
              />
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}
