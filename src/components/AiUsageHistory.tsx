import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../state/AppProvider';
import { localDay } from '../core/nutrition';
import { summarizeUsage } from '../core/aiUsage';
import { Body, Button, Label, fonts, useTheme } from './ui';

export function AiUsageHistory() {
  const { aiUsage, settings, t } = useApp();
  const colors = useTheme();
  const [day, setDay] = useState(localDay());
  const [visible, setVisible] = useState(20);
  const [expanded, setExpanded] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      setDay(localDay());
      const timer = setInterval(() => setDay(localDay()), 60000);
      return () => clearInterval(timer);
    }, []),
  );
  const history = useMemo(
    () => [...aiUsage].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [aiUsage],
  );
  const today = summarizeUsage(history.filter((entry) => entry.day === day));
  const all = summarizeUsage(history);
  const number = (value: number | null) =>
    value === null ? t.unknown : value.toLocaleString(settings.language);
  const statuses = {
    pending: t.aiStatusPending,
    success: t.aiStatusSuccess,
    error: t.aiStatusError,
    cancelled: t.aiStatusCancelled,
  };
  return (
    <View>
      <View style={{ gap: 6, marginVertical: 16 }}>
        <Body>
          {t.aiRequestsToday}: {number(today.requests)}
          {settings.aiDailyLimit ? ` / ${settings.aiDailyLimit}` : ''}
        </Body>
        <Body>
          {t.aiTokensToday}: {number(today.total)}
        </Body>
        <Body>
          {t.aiTokensAll}: {number(all.total)}
        </Body>
        <Body muted>
          {t.aiInputTokens}: {number(all.input)} · {t.aiOutputTokens}:{' '}
          {number(all.output)}
        </Body>
        {all.unknown > 0 && (
          <Body muted>
            {t.aiUsageUnknown}: {all.unknown}
          </Body>
        )}
      </View>
      <Body muted>{t.aiUsageHelp}</Body>
      <Label>{t.aiHistory}</Label>
      {!history.length && <Body muted>{t.aiHistoryEmpty}</Body>}
      {history.slice(0, visible).map((entry) => {
        const open = expanded === entry.id;
        return (
          <View
            key={entry.id}
            style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setExpanded(open ? null : entry.id)}
              style={({ pressed }) => ({
                paddingVertical: 14,
                minHeight: 64,
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              })}
            >
              <View style={{ flex: 1, gap: 5 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    color: colors.text,
                    fontSize: 15,
                  }}
                >
                  {entry.kind === 'meal' ? t.aiMeal : t.aiProduct}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  {new Date(entry.createdAt).toLocaleString(settings.language)}{' '}
                  · {statuses[entry.status]}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    color: colors.text,
                    fontSize: 13,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {t.aiTotalTokens}: {number(entry.tokens.total)}
                </Text>
              </View>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.muted}
              />
            </Pressable>
            {open && (
              <View style={{ gap: 4, paddingBottom: 16 }}>
                <Body muted>{entry.model}</Body>
                <Body>
                  {t.aiInputTokens}: {number(entry.tokens.input)}
                </Body>
                <Body>
                  {t.aiOutputTokens}: {number(entry.tokens.output)}
                </Body>
                <Body>
                  {t.aiThinkingTokens}: {number(entry.tokens.thinking)}
                </Body>
                <Body>
                  {t.aiCachedTokens}: {number(entry.tokens.cached)}
                </Body>
              </View>
            )}
          </View>
        );
      })}
      {visible < history.length && (
        <Button
          title={t.aiMoreHistory}
          secondary
          onPress={() => setVisible((value) => value + 20)}
        />
      )}
    </View>
  );
}
