import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../state/AppProvider';
import { localDay, totals, validDay } from '../core/nutrition';
import { Page, Nutrition, Button, Body } from '../components/ui';
export default function NutritionDetails() {
  const { day: requested } = useLocalSearchParams<{ day?: string }>();
  const { meals, settings, t } = useApp();
  const day = requested && validDay(requested) ? requested : localDay();
  const value = totals(
    meals
      .filter((meal) => meal.day === day)
      .flatMap((meal) => meal.ingredients),
  );
  return (
    <Page>
      <Body muted>
        {new Date(`${day}T12:00:00`).toLocaleDateString(settings.language, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Body>
      <Nutrition value={value} heading={t.dailyTotal} />
      <Button
        title={t.macroGoals}
        secondary
        icon="options-outline"
        onPress={() => router.push('/(tabs)/settings')}
      />
    </Page>
  );
}
