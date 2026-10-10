import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion } from './motion';
import { useTheme } from './ui';

/** Keep the native modal alive through its exit, without timers or stale close callbacks. */
export function Overlay({
  open,
  onClose,
  closeLabel,
  placement = 'bottom',
  children,
}: {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  placement?: 'bottom' | 'center';
  children: React.ReactNode;
}) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const [present, setPresent] = useState(open);
  const progress = useSharedValue(0);
  const reduced = useReducedMotion();
  // Latch presence on the opening render; only the exit completion releases it.
  if (open && !present) setPresent(true);
  useEffect(() => {
    if (!present) return;
    progress.set(
      withTiming(
        open ? 1 : 0,
        {
          duration: open ? motion.enter : motion.exit,
          easing: motion.easeSheet,
        },
        (finished) => {
          if (finished && !open) scheduleOnRN(setPresent, false);
        },
      ),
    );
    return () => cancelAnimation(progress);
  }, [open, present, progress]);
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const panel = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: reduced
      ? []
      : placement === 'bottom'
        ? [{ translateY: (1 - progress.get()) * 24 }]
        : [{ scale: 0.97 + progress.get() * 0.03 }],
  }));
  if (!present) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', inset: 0, backgroundColor: '#00000066' },
            backdrop,
          ]}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            justifyContent: placement === 'bottom' ? 'flex-end' : 'center',
            paddingHorizontal: placement === 'center' ? 24 : 0,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={{ position: 'absolute', inset: 0 }}
          />
          <Animated.View
            accessibilityViewIsModal
            pointerEvents={open ? 'auto' : 'none'}
            style={[
              {
                backgroundColor: colors.bg,
                maxHeight: '85%',
                width: '100%',
                maxWidth: 560,
                alignSelf: 'center',
                borderRadius: placement === 'center' ? 20 : 0,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: 'hidden',
              },
              panel,
            ]}
          >
            <ScrollView
              style={{ flexGrow: 0 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                padding: 24,
                paddingBottom:
                  placement === 'bottom' ? Math.max(24, insets.bottom) : 24,
                gap: 12,
              }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
