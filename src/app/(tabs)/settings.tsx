import React, { useState } from 'react';
import { Linking, Platform, Switch, View } from 'react-native';
import { useApp } from '../../state/AppProvider';
import { Language, parseNumber } from '../../core/nutrition';
import {
  Body,
  Button,
  Field,
  Label,
  Notice,
  Page,
  useTheme,
} from '../../components/ui';
import { confirmAction } from '../../components/confirm';
export default function SettingsScreen() {
  const { settings, apiKey, updateSettings, clear, t } = useApp();
  const colors = useTheme();
  const [goal, setGoal] = useState(String(settings.goal));
  const [model, setModel] = useState(settings.model);
  const [key, setKey] = useState(apiKey);
  const [language, setLanguage] = useState<Language>(settings.language);
  const [consent, setConsent] = useState(settings.consent);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  async function save() {
    const value = parseNumber(goal);
    if (
      !Number.isFinite(value) ||
      value <= 0 ||
      !/^[a-zA-Z0-9._-]+$/.test(model.trim())
    ) {
      setError(true);
      setMessage(t.invalidSettings);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await updateSettings(
        { goal: value, model: model.trim(), language, consent },
        key,
      );
      setError(false);
      setMessage(language === 'pl' ? 'Zapisano' : 'Saved');
    } catch {
      setError(true);
      setMessage(t.storageError);
    } finally {
      setBusy(false);
    }
  }
  async function removeAll() {
    if (!(await confirmAction(t.clear, t.clearBody, t.clear, t.cancel, true)))
      return;
    setBusy(true);
    setMessage('');
    try {
      await clear();
      setGoal('2000');
      setModel('gemini-3.5-flash-lite');
      setKey('');
      setConsent(false);
      setError(false);
      setMessage(t.resetDone);
    } catch {
      setError(true);
      setMessage(t.storageError);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Label large>{t.goal}</Label>
      <Field
        label={`${t.goal} (${t.kcal})`}
        value={goal}
        onChangeText={setGoal}
        keyboardType="decimal-pad"
        editable={!busy}
      />
      <Label>{t.key}</Label>
      <Body muted>{t.keyHelp}</Body>
      <View style={{ marginTop: 16 }}>
        <Field
          label={t.key}
          value={key}
          onChangeText={setKey}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={t.keyHint}
          editable={!busy}
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
        {key ? (
          <Button
            title={t.removeKey}
            secondary
            disabled={busy}
            onPress={() => setKey('')}
          />
        ) : null}
      </View>
      <View style={{ marginTop: 20 }}>
        <Field
          label={t.model}
          value={model}
          onChangeText={setModel}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />
        <Body muted>{t.modelHelp}</Body>
      </View>
      <Label>{t.language}</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Button
          title="Polski"
          secondary={language !== 'pl'}
          disabled={busy}
          onPress={() => setLanguage('pl')}
        />
        <Button
          title="English"
          secondary={language !== 'en'}
          disabled={busy}
          onPress={() => setLanguage('en')}
        />
      </View>
      <Label>{t.storage}</Label>
      <Body muted>{t.storageBody}</Body>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
          marginVertical: 20,
        }}
      >
        <View style={{ flex: 1 }}>
          <Body>{t.consentLabel}</Body>
        </View>
        <Switch
          accessibilityLabel={t.consentLabel}
          value={consent}
          disabled={busy}
          onValueChange={async (value) => {
            if (!value) {
              setConsent(false);
              return;
            }
            if (
              await confirmAction(
                t.consentTitle,
                t.consentBody,
                t.allow,
                t.cancel,
              )
            )
              setConsent(true);
          }}
          trackColor={{ true: colors.primary }}
        />
      </View>
      <Button
        title={t.aiTerms}
        secondary
        icon="open-outline"
        onPress={() => {
          void Linking.openURL('https://ai.google.dev/gemini-api/terms');
        }}
      />
      {Platform.OS === 'web' && <Notice text={t.webNotice} />}
      {message ? <Notice text={message} error={error} /> : null}
      <Button
        title={t.saveSettings}
        loading={busy}
        onPress={() => {
          void save();
        }}
      />
      <View style={{ marginTop: 32 }}>
        <Button
          title={t.clear}
          danger
          disabled={busy}
          icon="trash-outline"
          onPress={() => {
            void removeAll();
          }}
        />
      </View>
    </Page>
  );
}
