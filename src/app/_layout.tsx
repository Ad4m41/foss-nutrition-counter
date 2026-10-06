import React from 'react';
import { useFonts } from 'expo-font';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { Manrope_800ExtraBold } from '@expo-google-fonts/manrope/800ExtraBold';
import { Stack as NativeStack } from 'expo-router';
import { Stack as JsStack } from 'expo-router/js-stack';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme, View } from 'react-native';
import { AppProvider, useApp } from '../state/AppProvider';
import { Button, Notice, useTheme, fonts } from '../components/ui';
import { StartupScreen } from '../components/StartupScreen';
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
  if ((!ready || (!fontsReady && !fontError)) && !error)
    return <StartupScreen />;
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
          <StartupScreen />
        )}
      </View>
    );
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <KeyGate>
        <ProfileGate>
          {Platform.OS === 'android' ? (
            <JsStack
              detachInactiveScreens={false}
              screenOptions={{
                animation: 'none',
                gestureEnabled: false,
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                cardStyle: { backgroundColor: colors.bg },
                headerTitleStyle: { fontFamily: fonts.bold },
              }}
            >
              <JsStack.Screen name="(tabs)" options={{ headerShown: false }} />
              <JsStack.Screen
                name="nutrition"
                options={{ title: t.dailyTotal }}
              />
              <JsStack.Screen name="profile" options={{ title: t.profile }} />
              <JsStack.Screen name="meal" options={{ title: t.addMeal }} />
              <JsStack.Screen
                name="product"
                options={{ title: t.checkProduct }}
              />
            </JsStack>
          ) : (
            <NativeStack
              screenOptions={{
                headerStyle: { backgroundColor: colors.bg },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                headerTitleStyle: { fontFamily: fonts.bold },
              }}
            >
              <NativeStack.Screen
                name="(tabs)"
                options={{ headerShown: false }}
              />
              <NativeStack.Screen
                name="nutrition"
                options={{ title: t.dailyTotal }}
              />
              <NativeStack.Screen
                name="profile"
                options={{ title: t.profile }}
              />
              <NativeStack.Screen name="meal" options={{ title: t.addMeal }} />
              <NativeStack.Screen
                name="product"
                options={{ title: t.checkProduct }}
              />
            </NativeStack>
          )}
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
