import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Profile, energyEstimate } from '../core/profile';
import { parseNumber } from '../core/nutrition';
import { useApp } from '../state/AppProvider';
import { Body, Button, Field, Label, Notice, Page, useTheme } from './ui';
export function ProfileForm({
  onDone,
  initial = false,
}: {
  onDone?: () => void;
  initial?: boolean;
}) {
  const { settings, updateSettings, t } = useApp();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const p = settings.profile;
  const [age, setAge] = useState(p ? String(p.age) : '');
  const [height, setHeight] = useState(p ? String(p.height) : '');
  const [weight, setWeight] = useState(p ? String(p.weight) : '');
  const [sex, setSex] = useState<Profile['sex'] | null>(p?.sex ?? null);
  const [activity, setActivity] = useState(p?.activity ?? 1);
  const [objective, setObjective] = useState<Profile['objective']>(
    p?.objective ?? 'maintain',
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const profile: Profile = {
    age: parseNumber(age),
    height: parseNumber(height),
    weight: parseNumber(weight),
    sex: sex as Profile['sex'],
    activity,
    objective,
  };
  const estimate = energyEstimate(profile);
  async function save(skip = false) {
    if (lock.current) return;
    if (!skip && !estimate) {
      setMessage(t.invalidProfile);
      return;
    }
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      await updateSettings({
        ...settings,
        profileSetupDone: true,
        ...(skip ? {} : { profile, goal: estimate!.goal }),
      });
      onDone?.();
    } catch {
      setMessage(t.storageError);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Page
      footer={
        <Button
          title={initial ? t.saveSettings : t.saveProfile}
          loading={busy}
          onPress={() => {
            void save();
          }}
        />
      }
    >
      <View style={{ paddingTop: initial ? insets.top + 16 : 0 }}>
        <Label large>{t.profile}</Label>
        <Body muted>{t.profileIntro}</Body>
        <View
          style={{
            marginTop: 24,
            flexDirection: 'row',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <View style={{ flexGrow: 1, flexBasis: '100%' }}>
            <Field
              label={t.age}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              editable={!busy}
            />
          </View>
          <View style={{ flexGrow: 1, flexBasis: '44%' }}>
            <Field
              label={t.height}
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              editable={!busy}
            />
          </View>
          <View style={{ flexGrow: 1, flexBasis: '44%' }}>
            <Field
              label={t.weight}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              editable={!busy}
            />
          </View>
        </View>
        <Label>{t.sex}</Label>
        <Body muted>{t.sexHelp}</Body>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Button
            title={t.female}
            secondary={sex !== 'female'}
            disabled={busy}
            onPress={() => setSex('female')}
          />
          <Button
            title={t.male}
            secondary={sex !== 'male'}
            disabled={busy}
            onPress={() => setSex('male')}
          />
        </View>
        <Label>{t.activity}</Label>
        <Body muted>{t.activityHelp}</Body>
        <View style={{ paddingVertical: 16 }}>
          <Slider
            accessibilityLabel={t.activity}
            accessibilityValue={{
              min: 0,
              max: 4,
              now: activity,
              text: t[`activity${activity}` as 'activity0'],
            }}
            style={{ width: '100%', height: 48 }}
            minimumValue={0}
            maximumValue={4}
            step={1}
            value={activity}
            disabled={busy}
            onValueChange={setActivity}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.line}
            thumbTintColor={colors.primary}
            tapToSeek
          />
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
          >
            {[0, 1, 2, 3, 4].map((level) => (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityLabel={t[`activity${level}` as 'activity0']}
                accessibilityState={{
                  selected: activity === level,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() => setActivity(level)}
                style={{
                  minHeight: 48,
                  minWidth: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: activity === level ? '700' : '400',
                    color: activity === level ? colors.primary : colors.muted,
                  }}
                >
                  {level + 1}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
              marginBottom: 8,
            }}
          >
            {t[`activity${activity}` as 'activity0']}
          </Text>
          <Body muted>
            {t[`activityDetail${activity}` as 'activityDetail0']}
          </Body>
        </View>
        <Label>{t.objective}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(['lose', 'maintain', 'gain'] as const).map((goal) => (
            <Button
              key={goal}
              title={t[goal]}
              secondary={objective !== goal}
              disabled={busy}
              onPress={() => setObjective(goal)}
            />
          ))}
        </View>
        {estimate && (
          <View
            style={{
              marginTop: 24,
              padding: 20,
              backgroundColor: colors.surface,
              borderRadius: 16,
            }}
          >
            <Body muted>{t.estimatedGoal}</Body>
            <Text
              style={{
                color: colors.text,
                fontSize: 28,
                fontWeight: '600',
                marginVertical: 8,
              }}
            >
              {estimate.goal} {t.kcal}
            </Text>
            <Body muted>PAL {estimate.pal.toFixed(1)}</Body>
          </View>
        )}
        <View style={{ marginTop: 16 }}>
          <Body muted>{t.estimateHelp}</Body>
        </View>
        {message ? <Notice error text={message} /> : null}
        {initial && (
          <Button
            title={t.skipProfile}
            secondary
            disabled={busy}
            onPress={() => {
              void save(true);
            }}
          />
        )}
      </View>
    </Page>
  );
}
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { settings } = useApp();
  const ready = settings.profileSetupDone || Boolean(settings.profile);
  return (
    <>
      <View style={{ flex: 1, display: ready ? 'flex' : 'none' }}>
        {children}
      </View>
      {!ready && <ProfileForm initial />}
    </>
  );
}
