import React, { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  SlideInDown,
  ReduceMotion,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { router, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedback } from './feedback';
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
  function add(mode: 'ai' | 'manual') {
    setAdding(false);
    router.push({
      pathname: '/meal',
      params: { day, mode },
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
      <NavigationTab
        focused={focused}
        icon={icon}
        selectedIcon={index === 0 ? 'restaurant' : 'options'}
        label={label}
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
      />
    );
  };
  return (
    <>
      <View
        style={{
          backgroundColor: colors.surface,
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
          {tab(0, 'restaurant-outline', t.diary)}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.addAction}
            onPress={() => {
              feedback('press');
              setAdding(true);
            }}
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
                {t.addAction}
              </Text>
              <Button
                title={t.addMeal}
                icon="sparkles-outline"
                onPress={() => add('ai')}
              />
              <Button
                title={t.manual}
                icon="create-outline"
                secondary
                onPress={() => add('manual')}
              />
              <Button
                title={t.checkProduct}
                icon="search-outline"
                secondary
                onPress={() => {
                  setAdding(false);
                  router.push('/product');
                }}
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

function NavigationTab({
  focused,
  icon,
  selectedIcon,
  label,
  onPress,
  onLongPress,
}: {
  focused: boolean;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  selectedIcon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const colors = useTheme();
  const selected = useSharedValue(focused ? 1 : 0);
  const scale = useSharedValue(1);
  useEffect(() => {
    selected.value = withTiming(focused ? 1 : 0, {
      duration: 220,
      reduceMotion: ReduceMotion.System,
    });
  }, [focused, selected]);
  const highlight = useAnimatedStyle(() => ({
    opacity: selected.value,
    transform: [{ scaleX: 0.65 + selected.value * 0.35 }],
  }));
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: -selected.value * 2 }],
  }));
  const press = (value: number) => {
    scale.set(
      withTiming(value, {
        duration: 110,
        reduceMotion: ReduceMotion.System,
      }),
    );
  };
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={() => {
        feedback();
        onPress();
      }}
      onLongPress={onLongPress}
      onPressIn={() => press(0.9)}
      onPressOut={() => press(1)}
      style={{
        flex: 1,
        minHeight: 64,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View style={[{ alignItems: 'center', gap: 3 }, pressStyle]}>
        <View
          style={{
            width: 64,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                inset: 0,
                borderRadius: 12,
                backgroundColor: colors.tint,
              },
              highlight,
            ]}
          />
          <Ionicons
            name={focused ? selectedIcon : icon}
            size={23}
            color={focused ? colors.primary : colors.muted}
          />
        </View>
        <Text
          style={{
            fontFamily: focused ? fonts.bold : fonts.medium,
            color: focused ? colors.primary : colors.muted,
            fontSize: 12,
          }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}
