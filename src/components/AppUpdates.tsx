import React, { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { RELEASES_URL } from '../core/releases';
import { installedVersion } from '../services/releases';
import { Body, Button, Label, Notice } from './ui';

export function AppUpdates() {
  const {
    t,
    appRelease: release,
    checkingUpdates: checking,
    updatesChecked: checked,
    updateError,
    checkUpdates: check,
  } = useApp();
  const [linkError, setLinkError] = useState(false);
  const error = updateError || linkError;
  return (
    <View>
      <Label>{t.updates}</Label>
      <Body muted>
        {t.appVersion}: {installedVersion()}
      </Body>
      {release && <Notice text={`${t.updateAvailable}: ${release.version}`} />}
      {checked && !release && !error && <Body muted>{t.upToDate}</Body>}
      {error && <Notice error text={t.updateError} />}
      <Button
        title={t.checkUpdates}
        secondary
        icon="refresh-outline"
        loading={checking}
        onPress={() => {
          setLinkError(false);
          void check();
        }}
      />
      {release && (
        <Button
          title={Platform.OS === 'android' ? t.downloadUpdate : t.viewRelease}
          icon="download-outline"
          onPress={() => {
            void Linking.openURL(
              Platform.OS === 'android' ? release.apk : release.url,
            ).catch(() => setLinkError(true));
          }}
        />
      )}
      <Button
        title={t.releaseHistory}
        secondary
        icon="open-outline"
        onPress={() => {
          void Linking.openURL(RELEASES_URL).catch(() => setLinkError(true));
        }}
      />
      <Body muted>{t.updateHelp}</Body>
    </View>
  );
}
