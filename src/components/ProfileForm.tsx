import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Profile, nutritionEstimate } from '../core/profile';
import { parseNumber } from '../core/nutrition';
import { useApp } from '../state/AppProvider';
import { AgeWheel } from './AgeWheel';
import { Segmented } from './Segmented';
import {
  Body,
  Button,
  Field,
  IconButton,
  Notice,
  Page,
  fonts,
  useTheme,
} from './ui';
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
  const [step, setStep] = useState(0);
  const [age, setAge] = useState<number | null>(p?.age ?? null);
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
    age: age ?? 30,
    height: parseNumber(height),
    weight: parseNumber(weight),
    sex: sex as Profile['sex'],
    activity,
    objective,
  };
  const estimate = nutritionEstimate(profile);
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
        ...(skip
          ? {}
          : {
              profile,
              goal: estimate!.goal,
              macroGoals: estimate!.macroGoals,
            }),
      });
      onDone?.();
    } catch {
      setMessage(t.storageError);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function next() {
    setMessage('');
    if (step === 0 && !estimate) {
      setMessage(t.invalidProfile);
      return;
    }
    if (step === 0 && age === null) setAge(30);
    if (step < 2) setStep(step + 1);
    else void save();
  }
  const title = [
    t.profileBodyTitle,
    t.profileActivityTitle,
    t.profileGoalTitle,
  ][step];
  return (
    <Page
      footer={
        <Button
          title={
            step < 2 ? t.continue : initial ? t.saveSettings : t.saveProfile
          }
          loading={busy}
          icon={step < 2 ? 'arrow-forward' : 'checkmark'}
          onPress={next}
        />
      }
    >
      <View style={{ paddingTop: initial ? insets.top + 8 : 0 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          {step > 0 ? (
            <IconButton
              label={t.back}
              icon="arrow-back"
              disabled={busy}
              onPress={() => {
                setMessage('');
                setStep(step - 1);
              }}
            />
          ) : (
            <View style={{ width: 48 }} />
          )}
          <View
            accessibilityLabel={`${t.profile}, ${step + 1}/3`}
            style={{ flexDirection: 'row', gap: 6 }}
          >
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={{
                  height: 4,
                  width: index === step ? 30 : 12,
                  borderRadius: 4,
                  backgroundColor: index <= step ? colors.primary : colors.line,
                }}
              />
            ))}
          </View>
          <View style={{ width: 48 }} />
        </View>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.display,
            color: colors.text,
            fontSize: 32,
            lineHeight: 40,
            letterSpacing: -0.7,
          }}
        >
          {title}
        </Text>
        <View style={{ marginTop: 12, marginBottom: 20 }}>
          <Body muted>
            {[t.profileIntro, t.activityHelp, t.profileGoalIntro][step]}
          </Body>
        </View>
        {step === 0 && (
          <>
            <Text
              style={{
                fontFamily: fonts.bold,
                color: colors.text,
                fontSize: 17,
              }}
            >
              {t.age}
            </Text>
            <AgeWheel
              value={age}
              onChange={setAge}
              label={t.age}
              disabled={busy}
            />
            <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
              <Field
                label={t.height}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                editable={!busy}
              />
              <Field
                label={t.weight}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                editable={!busy}
              />
            </View>
            <Text
              style={{
                fontFamily: fonts.bold,
                color: colors.text,
                fontSize: 17,
                marginTop: 12,
                marginBottom: 12,
              }}
            >
              {t.sex}
            </Text>
            <Segmented
              options={[
                { value: 'female', label: t.female },
                { value: 'male', label: t.male },
              ]}
              value={sex}
              onChange={setSex}
              disabled={busy}
            />
            <View style={{ marginTop: 10 }}>
              <Body muted>{t.sexHelp}</Body>
            </View>
          </>
        )}
        {step === 1 && (
          <>
            <View style={{ paddingVertical: 18 }}>
              <Slider
                accessibilityLabel={t.activity}
                accessibilityValue={{
                  min: 0,
                  max: 4,
                  now: activity,
                  text: t[`activity${activity}` as 'activity0'],
                }}
                value={activity}
                minimumValue={0}
                maximumValue={4}
                step={1}
                disabled={busy}
                onValueChange={setActivity}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.line}
                thumbTintColor={colors.primary}
                style={{ height: 48, width: '100%' }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                }}
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
                      minWidth: 48,
                      minHeight: 48,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 16,
                        color:
                          activity === level ? colors.primary : colors.muted,
                      }}
                    >
                      {level + 1}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View
              style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: colors.tint,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  color: colors.primary,
                  fontSize: 22,
                  marginBottom: 8,
                }}
              >
                {t[`activity${activity}` as 'activity0']}
              </Text>
              <Body>{t[`activityDetail${activity}` as 'activityDetail0']}</Body>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  color: colors.primary,
                  marginTop: 16,
                }}
              >
                PAL {estimate?.pal.toFixed(1)}
              </Text>
            </View>
          </>
        )}
        {step === 2 && (
          <>
            {(['lose', 'maintain', 'gain'] as const).map((goal) => (
              <Pressable
                key={goal}
                accessibilityRole="button"
                accessibilityLabel={t[goal]}
                accessibilityState={{
                  selected: goal === objective,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() => setObjective(goal)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  paddingVertical: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.line,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor:
                      goal === objective ? colors.accent : colors.tint,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons
                    name={
                      goal === 'lose'
                        ? 'trending-down-outline'
                        : goal === 'gain'
                          ? 'trending-up-outline'
                          : 'remove-outline'
                    }
                    size={24}
                    color={
                      goal === objective ? colors.accentText : colors.primary
                    }
                  />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontFamily: fonts.bold,
                    color: colors.text,
                    fontSize: 18,
                  }}
                >
                  {t[goal]}
                </Text>
                <Ionicons
                  name={
                    goal === objective ? 'checkmark-circle' : 'ellipse-outline'
                  }
                  size={24}
                  color={goal === objective ? colors.primary : colors.muted}
                />
              </Pressable>
            ))}
            {estimate && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  padding: 24,
                  borderRadius: 16,
                  marginVertical: 24,
                }}
              >
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    color: colors.onPrimary,
                    fontSize: 15,
                  }}
                >
                  {t.estimatedGoal}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.display,
                    color: colors.onPrimary,
                    fontSize: 36,
                    marginVertical: 8,
                  }}
                >
                  {estimate.goal} <Text style={{ fontSize: 18 }}>kcal</Text>
                </Text>
                <View style={{ gap: 6, marginBottom: 16 }}>
                  {(['protein', 'carbs', 'fat'] as const).map((key) => (
                    <Text
                      key={key}
                      style={{
                        fontFamily: fonts.medium,
                        color: colors.onPrimary,
                      }}
                    >
                      {t[key]}: {estimate.macroGoals[key]} g
                    </Text>
                  ))}
                </View>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    color: colors.onPrimary,
                    fontSize: 14,
                  }}
                >
                  {t.editGoalLater}
                </Text>
              </View>
            )}
            <Body muted>{t.estimateHelp}</Body>
          </>
        )}
        {message ? (
          <View style={{ marginTop: 20 }}>
            <Notice error text={message} />
          </View>
        ) : null}
        {initial && (
          <View style={{ marginTop: 24 }}>
            <Button
              title={t.skipProfile}
              secondary
              disabled={busy}
              onPress={() => {
                void save(true);
              }}
            />
          </View>
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
