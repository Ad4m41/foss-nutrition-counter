import React from 'react';
import { router, Stack } from 'expo-router';
import { ProfileForm } from '../components/ProfileForm';
import { useApp } from '../state/AppProvider';
export default function ProfileScreen() {
  const { t } = useApp();
  return (
    <>
      <Stack.Screen options={{ title: t.profile }} />
      <ProfileForm
        onDone={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
      />
    </>
  );
}
