import React from 'react';
import { Text } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { AppProvider, useApp } from '../src/state/AppProvider';
import { LanguageSelect } from '../src/components/LanguageSelect';
import { en, pl } from '../src/core/i18n';
import * as storage from '../src/services/storage';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'pl' }],
  useLocales: () => [{ languageCode: 'pl' }],
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../src/services/storage', () => ({
  listMeals: jest.fn().mockResolvedValue([]),
  readSettings: jest.fn().mockResolvedValue(null),
  readKey: jest.fn().mockResolvedValue(null),
  readWater: jest.fn().mockResolvedValue({}),
  readAiUsage: jest.fn().mockResolvedValue([]),
  writeSettings: jest.fn().mockResolvedValue(undefined),
}));
function Probe() {
  const { ready, t } = useApp();
  return ready ? (
    <>
      <Text>{t.goal}</Text>
      <LanguageSelect />
    </>
  ) : null;
}
test('phone language is the default; choosing English immediately translates and persists; system restores Polish', async () => {
  await render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  await waitFor(() => expect(screen.getByText(pl.goal)).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: '🇵🇱 Polski' }));
  await fireEvent.changeText(
    screen.getByLabelText(pl.searchLanguage),
    'angielski',
  );
  expect(screen.queryByRole('button', { name: 'Polski' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'English' }));
  await waitFor(() => expect(screen.getByText(en.goal)).toBeTruthy());
  expect(storage.writeSettings).toHaveBeenCalledWith(
    expect.objectContaining({ language: 'en', languageMode: 'manual' }),
  );
  await fireEvent(
    screen.getByLabelText(en.systemLanguage),
    'valueChange',
    true,
  );
  await waitFor(() => expect(screen.getByText(pl.goal)).toBeTruthy());
});

test('a saved manual choice overrides the phone on reopening', async () => {
  jest.mocked(storage.readSettings).mockResolvedValueOnce({
    goal: 2000,
    language: 'en',
    languageMode: 'manual',
    consent: false,
    model: 'gemini-3.5-flash-lite',
  });
  await render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  await waitFor(() => expect(screen.getByText(en.goal)).toBeTruthy());
});

test('failed language persistence keeps the current language and shows the error', async () => {
  jest
    .mocked(storage.writeSettings)
    .mockRejectedValueOnce(new Error('storage unavailable'));
  await render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  await waitFor(() => expect(screen.getByText(pl.goal)).toBeTruthy());
  await fireEvent.press(screen.getByRole('button', { name: '🇵🇱 Polski' }));
  await fireEvent.press(screen.getByRole('button', { name: 'English' }));
  await waitFor(() =>
    expect(screen.getAllByText(pl.storageError).length).toBeGreaterThan(0),
  );
  expect(screen.getByText(pl.goal)).toBeTruthy();
});

test('loading an older profile populates all nutrition targets and persists them', async () => {
  jest.mocked(storage.readSettings).mockResolvedValueOnce({
    goal: 2000,
    language: 'pl',
    consent: false,
    model: 'gemini-3.5-flash-lite',
    profile: {
      age: 30,
      height: 180,
      weight: 80,
      sex: 'male',
      activity: 1,
      objective: 'maintain',
    },
  });
  await render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  await waitFor(() => expect(screen.getByText(pl.goal)).toBeTruthy());
  expect(storage.writeSettings).toHaveBeenCalledWith(
    expect.objectContaining({
      goal: 2848,
      macroGoals: { protein: 108, carbs: 390, fat: 95 },
    }),
  );
});

test('loading already configured macro goals preserves manual overrides', async () => {
  jest.mocked(storage.readSettings).mockResolvedValueOnce({
    goal: 2300,
    language: 'pl',
    consent: false,
    model: 'gemini-3.5-flash-lite',
    macroGoals: { protein: 90, carbs: 250, fat: 60 },
    profile: {
      age: 30,
      height: 180,
      weight: 80,
      sex: 'male',
      activity: 1,
      objective: 'maintain',
    },
  });
  await render(
    <AppProvider>
      <Probe />
    </AppProvider>,
  );
  await waitFor(() => expect(screen.getByText(pl.goal)).toBeTruthy());
  expect(storage.writeSettings).not.toHaveBeenCalled();
});
