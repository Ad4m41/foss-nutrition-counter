import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { motion } from './motion';
import { useApp } from '../state/AppProvider';
import { useTheme } from './ui';

const LOGO_ENTER = FadeIn.duration(motion.enter).reduceMotion(
  ReduceMotion.System,
);

/** Shared by storage/font loading and silent saved-key validation. */
export function StartupScreen() {
  const colors = useTheme();
  const { t } = useApp();
  return (
    <View
      accessibilityLabel={t.startupLoading}
      accessibilityRole="progressbar"
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 28,
      }}
    >
      <Animated.Image
        entering={LOGO_ENTER}
        source={require('../../assets/icon.png')}
        accessible={false}
        style={{ width: 112, height: 112, borderRadius: 26 }}
      />
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}
