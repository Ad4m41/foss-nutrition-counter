import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { feedback } from './feedback';
import { ProgressTrack } from './ProgressTrack';
import { Body, Notice, fonts, useTheme } from './ui';
export function WaterTracker({ day }: { day: string }) {
  const { water, adjustWater, settings, t } = useApp();
  const colors = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [help, setHelp] = useState(false);
  const lock = useRef(false);
  const ml = water[day] ?? 0;
  const goal = settings.waterGoal ?? 2000;
  async function change(amount: number) {
    if (lock.current) return;
    feedback('press');
    lock.current = true;
    setBusy(true);
    setError(false);
    try {
      await adjustWater(day, amount);
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
          backgroundColor: colors.waterTint,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
          padding: 18,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
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
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: help }}
          onPress={() => {
            feedback();
            setHelp(!help);
          }}
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
      </View>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
        {[250, -250].map((amount, index) => (
          <Pressable
            key={amount}
            accessibilityRole="button"
            accessibilityLabel={`${amount > 0 ? '+' : '−'}250 ml`}
            accessibilityState={{ disabled: busy || (amount < 0 && ml === 0) }}
            disabled={busy || (amount < 0 && ml === 0)}
            onPress={() => {
              void change(amount);
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 52,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.waterTint,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              borderBottomLeftRadius: index === 0 ? 16 : 6,
              borderBottomRightRadius: index === 0 ? 6 : 16,
              opacity:
                busy || (amount < 0 && ml === 0) ? 0.45 : pressed ? 0.75 : 1,
            })}
          >
            <Text
              style={{
                color: colors.text,
                fontFamily: fonts.bold,
                fontSize: 16,
              }}
            >
              {amount > 0 ? '+' : '−'}250 ml
            </Text>
          </Pressable>
        ))}
      </View>
      {error && (
        <View style={{ marginTop: 12 }}>
          <Notice error text={t.storageError} />
        </View>
      )}
    </View>
  );
}
