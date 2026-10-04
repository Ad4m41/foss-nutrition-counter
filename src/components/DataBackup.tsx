import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { useApp } from '../state/AppProvider';
import { pickBackup, shareBackup } from '../services/backup';
import { confirmAction } from './confirm';
import { Body, Button, Label, Notice } from './ui';
export function DataBackup() {
  const { meals, water, settings, aiUsage, aiBusy, restoreBackup, t } =
    useApp();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(false);
  const lock = useRef(false);
  async function run(restore: boolean) {
    if (lock.current || aiBusy) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    setError(false);
    try {
      if (restore) {
        const backup = await pickBackup();
        if (
          !backup ||
          !(await confirmAction(
            t.importBackup,
            t.restoreWarning,
            t.importBackup,
            t.cancel,
            true,
          ))
        )
          return;
        await restoreBackup(backup);
        setMessage(t.backupRestored);
      } else {
        await shareBackup({ meals, water, settings, aiUsage });
        setMessage(t.backupExported);
      }
    } catch {
      setError(true);
      setMessage(t.backupError);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <View>
      <Label>{t.backup}</Label>
      <Body muted>{t.backupHelp}</Body>
      <Button
        title={t.exportBackup}
        secondary
        icon="share-outline"
        disabled={busy || aiBusy}
        onPress={() => {
          void run(false);
        }}
      />
      <Button
        title={t.importBackup}
        secondary
        icon="download-outline"
        disabled={busy || aiBusy}
        onPress={() => {
          void run(true);
        }}
      />
      {message && <Notice text={message} error={error} />}
    </View>
  );
}
