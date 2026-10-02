import React from 'react';
import { Tabs } from 'expo-router';
import { useApp } from '../../state/AppProvider';
import { DiaryProvider } from '../../state/DiaryProvider';
import { DiaryNavigation } from '../../components/DiaryNavigation';
import { fonts, useTheme } from '../../components/ui';
export default function TabLayout() {
  const { t } = useApp();
  const colors = useTheme();
  return (
    <DiaryProvider>
      <Tabs
        tabBar={(props) => <DiaryNavigation {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.display, fontSize: 26 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: t.diary, headerShown: false }}
        />
        <Tabs.Screen name="settings" options={{ title: t.settings }} />
      </Tabs>
    </DiaryProvider>
  );
}
