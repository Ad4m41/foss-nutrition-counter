import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Linking, Platform, Switch, View } from 'react-native';
import { useApp } from '../../state/AppProvider';
import { macroKeys, parseMacroGoals } from '../../core/macroGoals';
import { parseNumber } from '../../core/nutrition';
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
import { SettingsSectionBar } from '../../components/SettingsSectionBar';
import { feedback } from '../../components/feedback';
import { LanguageSelect } from '../../components/LanguageSelect';
import { AppUpdates } from '../../components/AppUpdates';
import { DataBackup } from '../../components/DataBackup';
import { AiUsageHistory } from '../../components/AiUsageHistory';
import { validRequestLimit } from '../../core/aiUsage';
export default function SettingsScreen() {
  const { settings, apiKey, updateSettings, clear, aiBusy, t } = useApp();
  const colors = useTheme();
  const [section, setSection] = useState<'account' | 'app'>('account');
  const { section: requestedSection } = useLocalSearchParams<{
    section?: string;
  }>();
  useFocusEffect(
    useCallback(() => {
      if (requestedSection === 'app') setSection('app');
    }, [requestedSection]),
  );
  const [waterGoal, setWaterGoal] = useState(
    String(settings.waterGoal ?? 2000),
  );
  const [macroDraft, setMacroDraft] = useState(() => ({
    protein: settings.macroGoals?.protein
      ? String(settings.macroGoals.protein)
      : '',
    carbs: settings.macroGoals?.carbs ? String(settings.macroGoals.carbs) : '',
    fat: settings.macroGoals?.fat ? String(settings.macroGoals.fat) : '',
  }));
  const [goal, setGoal] = useState(String(settings.goal));
  const [aiLimit, setAiLimit] = useState(
    settings.aiDailyLimit === undefined ? '' : String(settings.aiDailyLimit),
  );
  useFocusEffect(
    useCallback(() => {
      setGoal(String(settings.goal));
      setMacroDraft({
        protein: settings.macroGoals?.protein
          ? String(settings.macroGoals.protein)
          : '',
        carbs: settings.macroGoals?.carbs
          ? String(settings.macroGoals.carbs)
          : '',
        fat: settings.macroGoals?.fat ? String(settings.macroGoals.fat) : '',
      });
    }, [settings.goal, settings.macroGoals]),
  );
  const [model, setModel] = useState(settings.model);
  const [key, setKey] = useState(apiKey);
  const language = settings.language;
  const [consent, setConsent] = useState(settings.consent);
  useFocusEffect(
    useCallback(() => {
      setWaterGoal(String(settings.waterGoal ?? 2000));
    }, [settings.waterGoal]),
  );
  useFocusEffect(
    useCallback(() => {
      setModel(settings.model);
    }, [settings.model]),
  );
  useFocusEffect(
    useCallback(() => {
      setConsent(settings.consent);
    }, [settings.consent]),
  );
  useFocusEffect(
    useCallback(() => {
      setAiLimit(
        settings.aiDailyLimit === undefined
          ? ''
          : String(settings.aiDailyLimit),
      );
    }, [settings.aiDailyLimit]),
  );
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  async function save() {
    const aiDailyLimit = aiLimit.trim() ? parseNumber(aiLimit) : undefined;
    if (section === 'app' && !validRequestLimit(aiDailyLimit)) {
      setError(true);
      setMessage(t.invalidAiLimit);
      return;
    }
    const value = parseNumber(goal);
    const water = parseNumber(waterGoal);
    const macroGoals = parseMacroGoals(macroDraft);
    if (section === 'account' && macroGoals === null) {
      setError(true);
      setMessage(t.invalidMacroGoals);
      return;
    }
    if (
      section === 'account'
        ? !Number.isFinite(value) ||
          value <= 0 ||
          !Number.isFinite(water) ||
          water < 100 ||
          water > 20000
        : !/^[a-zA-Z0-9._-]+$/.test(model.trim())
    ) {
      setError(true);
      setMessage(t.invalidSettings);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await updateSettings(
        {
          ...settings,
          ...(section === 'account'
            ? {
                goal: value,
                macroGoals: macroGoals!,
                waterGoal: Math.round(water),
              }
            : {
                model: model.trim(),
                language,
                consent,
                skipKeySetup: !key.trim(),
                aiDailyLimit,
              }),
        },
        section === 'app' ? key : undefined,
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
      setWaterGoal('2000');
      setMacroDraft({ protein: '', carbs: '', fat: '' });
      setModel('gemini-3.5-flash-lite');
      setKey('');
      setConsent(false);
      setAiLimit('');
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
    <Page
      footer={
        <SettingsSectionBar
          value={section}
          onChange={setSection}
          disabled={busy}
        />
      }
      footerInset={false}
      footerFullWidth
    >
      <View style={{ display: section === 'account' ? 'flex' : 'none' }}>
        <Button
          title={t.profile}
          secondary
          icon="person-outline"
          disabled={busy}
          onPress={() => router.push('/profile')}
        />
        <Label large>{t.goal}</Label>
        <Field
          label={`${t.goal} (${t.kcal})`}
          value={goal}
          onChangeText={setGoal}
          keyboardType="decimal-pad"
          editable={!busy}
        />
        <Field
          label={t.waterGoal}
          value={waterGoal}
          onChangeText={setWaterGoal}
          keyboardType="number-pad"
          editable={!busy}
        />
        <Body muted>{t.waterHelp}</Body>
        <Label>{t.macroGoals}</Label>
        <Body muted>{t.macroGoalsHelp}</Body>
        <View style={{ marginTop: 16 }}>
          {macroKeys.map((key) => (
            <Field
              key={key}
              label={`${t[key]} (g)`}
              value={macroDraft[key]}
              keyboardType="decimal-pad"
              editable={!busy}
              onChangeText={(value) =>
                setMacroDraft((current) => ({ ...current, [key]: value }))
              }
            />
          ))}
        </View>
      </View>
      <View style={{ display: section === 'app' ? 'flex' : 'none' }}>
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
        <AppUpdates />
        <Label>{t.language}</Label>
        <LanguageSelect disabled={busy} />
        <Label>{t.aiUsageTitle}</Label>
        <Field
          label={t.aiDailyLimit}
          value={aiLimit}
          onChangeText={setAiLimit}
          placeholder={t.aiLimitHint}
          keyboardType="number-pad"
          editable={!busy && !aiBusy}
        />
        <Body muted>{t.aiLimitHelp}</Body>
        <AiUsageHistory />
        <DataBackup />
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
              feedback();
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
      </View>
      {message ? <Notice text={message} error={error} /> : null}
      <Button
        title={t.saveSettings}
        loading={busy}
        disabled={aiBusy}
        onPress={() => {
          void save();
        }}
      />
      <View
        style={{ display: section === 'app' ? 'flex' : 'none', marginTop: 32 }}
      >
        <Button
          title={t.clear}
          danger
          disabled={busy || aiBusy}
          icon="trash-outline"
          onPress={() => {
            void removeAll();
          }}
        />
        <Button
          title={t.license}
          secondary
          icon="open-outline"
          onPress={() => {
            void Linking.openURL('https://www.gnu.org/licenses/agpl-3.0.html');
          }}
        />
      </View>
    </Page>
  );
}
