import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { ProgressTrack } from './ProgressTrack';
import { Body, Button, Notice, fonts, useTheme } from './ui';
export function WaterTracker({ day }: { day: string }) {
  const { water, adjustWater, settings, t } = useApp();
  const colors = useTheme();
  const [lastDrink, setLastDrink] = useState<{
    day: string;
    ml: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [help, setHelp] = useState(false);
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
    <View>
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
            <Ionicons name="water-outline" size={22} color={colors.water} />
            <Text
              style={{
                fontFamily: fonts.bold,
                color: colors.text,
                fontSize: 19,
              }}
            >
              {t.water}
            </Text>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontFamily: fonts.bold,
              marginTop: 12,
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
      </View>
      <ProgressTrack
        value={ml}
        goal={goal}
        color={colors.water}
        label={t.water}
      />
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: help }}
        onPress={() => setHelp(!help)}
        style={{ minHeight: 48, justifyContent: 'center' }}
      >
        <Text
          style={{
            fontFamily: fonts.medium,
            color: colors.muted,
            fontSize: 12,
          }}
        >
          {t.waterInfo} {help ? '−' : '+'}
        </Text>
      </Pressable>
      {help && (
        <View style={{ gap: 8 }}>
          <Body muted>{t.waterHelp}</Body>
        </View>
      )}
      {error && <Notice error text={t.storageError} />}
    </View>
  );
}
