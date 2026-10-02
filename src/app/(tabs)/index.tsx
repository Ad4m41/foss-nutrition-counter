import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../../state/AppProvider';
import { useDiaryDay } from '../../state/DiaryProvider';
import { localDay, moveDay, totals } from '../../core/nutrition';
import { WaterTracker } from '../../components/WaterTracker';
import { MacroDock } from '../../components/MacroDock';
import { Body, IconButton, Page, fonts, useTheme } from '../../components/ui';
export default function Diary() {
  const { meals, settings, t } = useApp();
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const daysInStrip =
    Math.min(useWindowDimensions().width - 48, 560) < 360 ? 5 : 7;
  const { day, setDay } = useDiaryDay();
  const entries = useMemo(
    () =>
      meals
        .filter((meal) => meal.day === day)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [meals, day],
  );
  const sum = totals(entries.flatMap((meal) => meal.ingredients));
  return (
    <Page footer={<MacroDock day={day} value={sum} />} footerInset={false}>
      <View
        style={{
          paddingTop: insets.top + 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fonts.display,
              fontSize: 32,
              letterSpacing: -0.7,
              color: colors.text,
            }}
          >
            {t.diary}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.today}
            onPress={() => setDay(localDay())}
            style={{ minHeight: 48, justifyContent: 'center' }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                color: colors.muted,
                fontSize: 14,
              }}
            >
              {new Date(`${day}T12:00:00`).toLocaleDateString(
                settings.language,
                { weekday: 'long', day: 'numeric', month: 'long' },
              )}
            </Text>
          </Pressable>
        </View>
        <IconButton
          label={t.previous}
          icon="chevron-back"
          onPress={() => setDay(moveDay(day, -1))}
        />
        <IconButton
          label={t.next}
          icon="chevron-forward"
          onPress={() => setDay(moveDay(day, 1))}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          marginTop: 10,
          marginBottom: 24,
        }}
      >
        {Array.from(
          { length: daysInStrip },
          (_, i) => i - Math.floor(daysInStrip / 2),
        ).map((offset) => {
          const date = moveDay(day, offset);
          const selected = offset === 0;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={new Date(
                `${date}T12:00:00`,
              ).toLocaleDateString(settings.language, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              onPress={() => setDay(date)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 64,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 14,
                backgroundColor: selected ? colors.primary : 'transparent',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 10,
                  color: selected ? colors.onPrimary : colors.muted,
                }}
              >
                {new Date(`${date}T12:00:00`).toLocaleDateString(
                  settings.language,
                  { weekday: 'short' },
                )}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 18,
                  color: selected ? colors.onPrimary : colors.text,
                }}
              >
                {new Date(`${date}T12:00:00`).getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Text
          style={{ fontFamily: fonts.bold, color: colors.text, fontSize: 21 }}
        >
          {t.meals}
        </Text>
        <Text
          style={{
            fontFamily: fonts.medium,
            color: colors.muted,
            fontSize: 13,
          }}
        >
          {entries.length}
        </Text>
      </View>
      {entries.length === 0 ? (
        <View style={{ paddingVertical: 28, gap: 16 }}>
          <View
            style={{
              width: 64,
              height: 64,
              backgroundColor: colors.accent,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="restaurant-outline"
              size={30}
              color={colors.accentText}
            />
          </View>
          <Text
            style={{ fontFamily: fonts.bold, fontSize: 24, color: colors.text }}
          >
            {t.emptyTitle}
          </Text>
          <Body muted>{t.emptyBody}</Body>
        </View>
      ) : (
        entries.map((meal) => {
          const total = totals(meal.ingredients);
          return (
            <Pressable
              key={meal.id}
              accessibilityRole="button"
              accessibilityLabel={`${meal.name}, ${Math.round(total.kcal)} ${t.kcal}`}
              onPress={() =>
                router.push({ pathname: '/meal', params: { id: meal.id } })
              }
              style={({ pressed }) => ({
                flexDirection: 'row',
                gap: 16,
                alignItems: 'center',
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {meal.photoUri ? (
                <Image
                  source={{ uri: meal.photoUri }}
                  accessible={false}
                  style={{ width: 88, height: 96, borderRadius: 16 }}
                />
              ) : (
                <View
                  style={{
                    width: 88,
                    height: 96,
                    borderRadius: 16,
                    backgroundColor: colors.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={28}
                    color={colors.primary}
                  />
                </View>
              )}
              <View style={{ flex: 1, gap: 7 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    color: colors.text,
                    fontSize: 18,
                  }}
                >
                  {meal.name}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    color: colors.energy,
                    fontSize: 15,
                  }}
                >
                  {Math.round(total.kcal)} kcal
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  {t.shortProtein} {Math.round(total.protein)} · {t.shortCarbs}{' '}
                  {Math.round(total.carbs)} · {t.shortFat}{' '}
                  {Math.round(total.fat)} g
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          );
        })
      )}
      <View
        style={{
          marginTop: 26,
          backgroundColor: colors.waterTint,
          padding: 18,
          borderRadius: 16,
        }}
      >
        <WaterTracker day={day} kcal={sum.kcal} />
      </View>
    </Page>
  );
}
