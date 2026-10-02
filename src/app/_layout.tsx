import React from 'react';
import { useFonts } from 'expo-font';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { AppProvider, useApp } from '../state/AppProvider';
import { Body, Button, Notice, useTheme, fonts } from '../components/ui';
import { KeyGate } from '../components/KeyGate';
import { ProfileGate } from '../components/ProfileForm';
function Navigation() {
  const { ready, error, reload, t } = useApp();
  const [fontsReady, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const colors = useTheme();
  const scheme = useColorScheme();
  if (!ready || (!fontsReady && !fontError))
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
      <KeyGate>
        <ProfileGate>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerTintColor: colors.text,
              contentStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
              headerTitleStyle: { fontFamily: fonts.bold },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="nutrition" options={{ title: t.dailyTotal }} />
            <Stack.Screen name="profile" options={{ title: t.profile }} />
            <Stack.Screen name="meal" options={{ title: t.addMeal }} />
          </Stack>
        </ProfileGate>
      </KeyGate>
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
