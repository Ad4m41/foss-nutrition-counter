import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../../state/AppProvider';
import { localDay, moveDay, totals } from '../../core/nutrition';
import {
  Body,
  Button,
  IconButton,
  Label,
  Nutrition,
  Page,
  useTheme,
} from '../../components/ui';
export default function Diary() {
  const { meals, settings, t } = useApp();
  const colors = useTheme();
  const [day, setDay] = useState(localDay());
  const entries = useMemo(
    () =>
      meals
        .filter((meal) => meal.day === day)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [meals, day],
  );
  const sum = totals(entries.flatMap((meal) => meal.ingredients));
  const diff = settings.goal - sum.kcal;
  return (
    <Page>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <IconButton
          label={t.previous}
          icon="chevron-back"
          onPress={() => setDay(moveDay(day, -1))}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.today}
          onPress={() => setDay(localDay())}
          style={{
            flex: 1,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 18,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {day === localDay()
              ? t.today
              : new Date(`${day}T12:00:00`).toLocaleDateString(
                  settings.language,
                  { day: 'numeric', month: 'long' },
                )}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            {new Date(`${day}T12:00:00`).toLocaleDateString(settings.language, {
              weekday: 'long',
              year: 'numeric',
            })}
          </Text>
        </Pressable>
        <IconButton
          label={t.next}
          icon="chevron-forward"
          onPress={() => setDay(moveDay(day, 1))}
        />
      </View>
      <View
        style={{
          backgroundColor: colors.tint,
          padding: 22,
          borderRadius: 16,
          marginTop: 16,
        }}
      >
        <Nutrition value={sum} heading={t.dailyTotal} />
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: settings.goal,
            now: Math.min(sum.kcal, settings.goal),
            text: `${Math.round(sum.kcal)} / ${settings.goal} ${t.kcal}`,
          }}
          style={{
            height: 8,
            backgroundColor: colors.line,
            borderRadius: 4,
            overflow: 'hidden',
            marginVertical: 8,
          }}
        >
          <View
            style={{
              height: 8,
              backgroundColor: colors.primary,
              width: `${Math.min(100, (sum.kcal / settings.goal) * 100)}%`,
            }}
          />
        </View>
        <Body muted>
          {Math.round(Math.abs(diff))} {t.kcal}{' '}
          {diff >= 0 ? t.remaining : t.over} · {settings.goal} {t.kcal}
        </Body>
      </View>
      <Label large>{t.meals}</Label>
      {entries.length === 0 ? (
        <View style={{ paddingVertical: 22, gap: 12 }}>
          <Ionicons
            name="restaurant-outline"
            size={36}
            color={colors.primary}
          />
          <Text style={{ color: colors.text, fontSize: 21, fontWeight: '600' }}>
            {t.emptyTitle}
          </Text>
          <Body muted>{t.emptyBody}</Body>
        </View>
      ) : (
        entries.map((meal) => (
          <Pressable
            key={meal.id}
            accessibilityRole="button"
            accessibilityLabel={`${meal.name}, ${Math.round(totals(meal.ingredients).kcal)} ${t.kcal}`}
            onPress={() =>
              router.push({ pathname: '/meal', params: { id: meal.id } })
            }
            style={({ pressed }) => ({
              flexDirection: 'row',
              gap: 14,
              alignItems: 'center',
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.line,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            {meal.photoUri ? (
              <Image
                source={{ uri: meal.photoUri }}
                accessibilityLabel={meal.name}
                style={{ width: 64, height: 64, borderRadius: 12 }}
              />
            ) : (
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 12,
                  backgroundColor: colors.tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="restaurant-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={{ flex: 1, gap: 5 }}>
              <Text
                style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}
              >
                {meal.name}
              </Text>
              <Body muted>
                {Math.round(totals(meal.ingredients).kcal)} {t.kcal} ·{' '}
                {meal.source === 'ai' ? t.ai : t.manualSource}
              </Body>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))
      )}
      <View style={{ marginTop: 24 }}>
        <Button
          title={t.addMeal}
          icon="add"
          onPress={() => router.push({ pathname: '/meal', params: { day } })}
        />
      </View>
    </Page>
  );
}
