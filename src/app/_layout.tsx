import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { AppProvider, useApp } from '../state/AppProvider';
import { Body, Button, Notice, useTheme } from '../components/ui';
function Navigation() {
  const { ready, error, reload, t } = useApp();
  const colors = useTheme();
  const scheme = useColorScheme();
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          padding: 28,
          gap: 16,
        }}
      >
        {error ? (
          <>
            <Notice error text={t.loadError} />
            <Button
              title={t.retry}
              onPress={() => {
                void reload();
              }}
            />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Body>{t.loading}</Body>
          </>
        )}
      </View>
    );
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="meal" options={{ title: t.addMeal }} />
      </Stack>
    </>
  );
}
export default function RootLayout() {
  return (
    <AppProvider>
      <Navigation />
    </AppProvider>
  );
}
