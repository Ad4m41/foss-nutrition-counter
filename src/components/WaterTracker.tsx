import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { OtterMascot } from './OtterMascot';
import { otterState } from '../core/otter';
import { Body, Button, Label, Notice, useTheme } from './ui';
export function WaterTracker({ day, kcal }: { day: string; kcal: number }) {
  const { water, adjustWater, settings, t } = useApp();
  const colors = useTheme();
  const [lastDrink, setLastDrink] = useState<{
    day: string;
    ml: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  const ml = water[day] ?? 0;
  const goal = settings.waterGoal ?? 2000;
  async function change(amount: number) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      await adjustWater(day, amount);
      setLastDrink(amount > 0 ? { day, ml: amount } : null);
    } catch {
      setError(true);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <View style={{ marginTop: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="water-outline" size={22} color={colors.primary} />
            <Label>{t.water}</Label>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: '600',
              fontVariant: ['tabular-nums'],
            }}
          >
            {ml}{' '}
            <Text
              style={{ fontSize: 15, color: colors.muted, fontWeight: '400' }}
            >
              / {goal} ml
            </Text>
          </Text>
        </View>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
        >
          <OtterMascot {...otterState(kcal, settings.goal, ml, goal)} />
        </View>
      </View>
      <Body muted>{t.otterHelp}</Body>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t.water}
        accessibilityValue={{
          min: 0,
          max: goal,
          now: Math.min(ml, goal),
          text: `${ml} / ${goal} ml`,
        }}
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.line,
          overflow: 'hidden',
          marginVertical: 12,
        }}
      >
        <View
          style={{
            height: 4,
            width: `${Math.min(100, (ml / goal) * 100)}%`,
            backgroundColor: colors.primary,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[250, 500].map((amount) => (
          <Button
            key={amount}
            title={`+ ${amount} ml`}
            secondary
            disabled={busy}
            onPress={() => {
              void change(amount);
            }}
          />
        ))}
        {lastDrink?.day === day && (
          <Button
            title={t.undoWater}
            secondary
            disabled={busy}
            onPress={() => {
              void change(-lastDrink.ml);
            }}
          />
        )}
      </View>
      <Body muted>{t.waterHelp}</Body>
      {error && <Notice error text={t.storageError} />}
    </View>
  );
}
