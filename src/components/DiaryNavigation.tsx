import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { SlideInDown, ReduceMotion } from 'react-native-reanimated';
import { router, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppProvider';
import { useDiaryDay } from '../state/DiaryProvider';
import { fonts, useTheme, Button } from './ui';
type BottomTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];
export function DiaryNavigation({ state, navigation }: BottomTabBarProps) {
  const { t } = useApp();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const { day } = useDiaryDay();
  const [adding, setAdding] = useState(false);
  function add(mode: 'camera' | 'manual') {
    setAdding(false);
    router.push({
      pathname: '/meal',
      params: { day, ...(mode === 'camera' ? { capture: 'camera' } : {}) },
    });
  }
  const tab = (
    index: number,
    icon: React.ComponentProps<typeof Ionicons>['name'],
    label: string,
  ) => {
    const route = state.routes[index];
    if (!route) return null;
    const focused = state.index === index;
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented)
            navigation.navigate(route.name, route.params);
        }}
        onLongPress={() =>
          navigation.emit({ type: 'tabLongPress', target: route.key })
        }
        style={{
          flex: 1,
          minHeight: 64,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <Ionicons
          name={icon}
          size={23}
          color={focused ? colors.primary : colors.muted}
        />
        <Text
          style={{
            fontFamily: focused ? fonts.bold : fonts.medium,
            color: focused ? colors.primary : colors.muted,
            fontSize: 12,
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };
  return (
    <>
      <View
        style={{
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: colors.line,
          paddingBottom: Math.max(8, insets.bottom),
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 560,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          {tab(0, 'journal-outline', t.diary)}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.addMeal}
            onPress={() => setAdding(true)}
            style={({ pressed }) => ({
              width: 58,
              height: 58,
              marginHorizontal: 18,
              borderRadius: 18,
              backgroundColor: colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.94 : 1 }],
            })}
          >
            <Ionicons name="add" size={30} color={colors.accentText} />
          </Pressable>
          {tab(1, 'options-outline', t.settings)}
        </View>
      </View>
      {adding && (
        <Modal
          visible={adding}
          transparent
          animationType="none"
          onRequestClose={() => setAdding(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              backgroundColor: '#00000066',
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.cancel}
              onPress={() => setAdding(false)}
              style={{ flex: 1 }}
            />
            <Animated.View
              entering={SlideInDown.duration(260).reduceMotion(
                ReduceMotion.System,
              )}
              accessibilityViewIsModal
              style={{
                backgroundColor: colors.bg,
                padding: 24,
                paddingBottom: Math.max(24, insets.bottom),
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <Text
                accessibilityRole="header"
                style={{
                  fontFamily: fonts.display,
                  color: colors.text,
                  fontSize: 27,
                  marginBottom: 20,
                }}
              >
                {t.addMeal}
              </Text>
              <Button
                title={t.camera}
                icon="camera-outline"
                onPress={() => add('camera')}
              />
              <Button
                title={t.manual}
                icon="create-outline"
                secondary
                onPress={() => add('manual')}
              />
              <Button
                title={t.cancel}
                secondary
                onPress={() => setAdding(false)}
              />
            </Animated.View>
          </View>
        </Modal>
      )}
    </>
  );
}
