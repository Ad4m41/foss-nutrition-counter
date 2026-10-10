import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { PressFeedback } from './PressFeedback';
import { Overlay } from './Overlay';
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
          <PressFeedback
            haptic="press"
            accessibilityRole="button"
            accessibilityLabel={t.addAction}
            onPress={() => {
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
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <Ionicons name="add" size={30} color={colors.accentText} />
          </PressFeedback>
          {tab(1, 'options-outline', t.settings)}
        </View>
      </View>
      <Overlay
        open={adding}
        onClose={() => setAdding(false)}
        closeLabel={t.cancel}
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
        <Button title={t.cancel} secondary onPress={() => setAdding(false)} />
      </Overlay>
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
  return (
    <PressFeedback
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
      onPress={() => {
        feedback();
        onPress();
      }}
      onLongPress={onLongPress}
      style={{
        flex: 1,
        minHeight: 64,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ alignItems: 'center', gap: 3 }}>
        <View
          style={{
            width: 64,
            height: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 12,
              backgroundColor: focused ? colors.tint : 'transparent',
            }}
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
      </View>
    </PressFeedback>
  );
}
