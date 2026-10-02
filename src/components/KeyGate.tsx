import React, { useEffect, useRef, useState } from 'react';
import { AppState, Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../state/AppProvider';
import { checkApiKey, KeyStatus } from '../services/gemini';
import { Body, Button, Field, Label, Notice, Page } from './ui';

export function KeyGate({ children }: { children: React.ReactNode }) {
  const { apiKey, settings, updateSettings, t } = useApp();
  const insets = useSafeAreaInsets();
  const [keyDraft, setKeyDraft] = useState({ source: apiKey, value: apiKey });
  const draft = keyDraft.source === apiKey ? keyDraft.value : apiKey;
  const [visible, setVisible] = useState(false);
  const [validation, setValidation] = useState<{
    key: string;
    launch: number;
    status: KeyStatus;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [launch, setLaunch] = useState(0);
  const action = useRef<AbortController | null>(null);
  const startupCheck = useRef<AbortController | null>(null);
  const approvedKey = useRef<string | null>(null);
  const inFlight = useRef(false);
  const current = validation?.key === apiKey && validation.launch === launch;
  const checking = Boolean(apiKey && !current);
  const allowed = apiKey
    ? current && validation?.status !== 'invalid'
    : settings.skipKeySetup === true;
  const displayedMessage =
    message ||
    (current && validation?.status === 'invalid' ? t.invalidKey : '');

  useEffect(() => {
    let wasBackground = AppState.currentState === 'background';
    const subscription = AppState.addEventListener('change', (next) => {
      if (wasBackground && next === 'active') {
        approvedKey.current = null;
        setLaunch((value) => value + 1);
        wasBackground = false;
      }
      if (next === 'background') wasBackground = true;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    startupCheck.current = controller;
    if (!apiKey || approvedKey.current === apiKey) return;
    void checkApiKey(apiKey, controller.signal).then((status) => {
      if (controller.signal.aborted) return;
      // A network/server failure cannot establish that a saved key is invalid.
      setValidation({ key: apiKey, launch, status });
    });
    return () => controller.abort();
  }, [apiKey, launch]);

  useEffect(() => () => action.current?.abort(), []);

  async function submit(skip = false) {
    if (inFlight.current || (checking && !skip)) return;
    inFlight.current = true;
    setBusy(true);
    setMessage('');
    const controller = new AbortController();
    action.current = controller;
    try {
      if (skip) {
        startupCheck.current?.abort();
      }
      const key = skip ? '' : draft.trim();
      let acceptedStatus: KeyStatus = 'valid';
      if (!skip) {
        const status = await checkApiKey(key, controller.signal);
        if (controller.signal.aborted) return;
        if (status === 'invalid' || status === 'unavailable') {
          setMessage(status === 'invalid' ? t.invalidKey : t.keyUnavailable);
          return;
        }
        acceptedStatus = status;
      }
      approvedKey.current = skip ? null : key;
      await updateSettings({ ...settings, skipKeySetup: skip }, key);
      setValidation(skip ? null : { key, launch, status: acceptedStatus });
    } catch {
      approvedKey.current = null;
      // Resume a saved-key check if skipping aborted it but persistence failed.
      if (skip && apiKey) setLaunch((value) => value + 1);
      setMessage(t.storageError);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      {/* Keep navigation and meal drafts mounted during foreground validation. */}
      <View
        style={{ flex: 1, display: allowed && !checking ? 'flex' : 'none' }}
      >
        {children}
      </View>
      {(!allowed || checking) && (
        <Page>
          <View style={{ paddingTop: insets.top + 24, gap: 12 }}>
            <Label large>{t.setupTitle}</Label>
            <Body muted>{t.setupBody}</Body>
            <View style={{ marginTop: 24 }}>
              <Field
                label={t.key}
                value={draft}
                onChangeText={(value) => {
                  setKeyDraft({ source: apiKey, value });
                  setMessage('');
                }}
                secureTextEntry={!visible}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={t.keyHint}
                editable={!busy && !checking}
                onSubmitEditing={() => {
                  void submit();
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Button
                title={visible ? t.hide : t.show}
                secondary
                onPress={() => setVisible(!visible)}
              />
              <Button
                title={t.getKey}
                secondary
                icon="open-outline"
                onPress={() => {
                  void Linking.openURL('https://aistudio.google.com/apikey');
                }}
              />
            </View>
            <Body muted>{t.keyCheckPrivacy}</Body>
            {displayedMessage ? <Notice error text={displayedMessage} /> : null}
            <Button
              title={checking ? t.checkingKey : t.checkKey}
              loading={busy || checking}
              disabled={!draft.trim()}
              onPress={() => {
                void submit();
              }}
            />
            <View style={{ marginTop: 24, gap: 12 }}>
              <Button
                title={t.skipKey}
                secondary
                disabled={busy}
                onPress={() => {
                  void submit(true);
                }}
              />
              <Body muted>{t.skipKeyHelp}</Body>
            </View>
          </View>
        </Page>
      )}
    </>
  );
}
