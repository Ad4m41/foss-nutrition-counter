import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  View,
} from 'react-native';
import { useApp } from '../state/AppProvider';
import { useTheme } from './ui';

/** Shared by storage/font loading and silent saved-key validation. */
export function StartupScreen() {
  const colors = useTheme();
  const { t } = useApp();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let active = true;
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!active || reduced) return;
        opacity.setValue(0.35);
        animation = Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        });
        animation.start();
      })
      .catch(() => {});
    return () => {
      active = false;
      animation?.stop();
    };
  }, [opacity]);
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
        source={require('../../assets/icon.png')}
        accessible={false}
        style={{ width: 112, height: 112, borderRadius: 26, opacity }}
      />
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}
