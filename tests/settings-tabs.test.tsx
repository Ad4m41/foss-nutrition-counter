import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import SettingsScreen from '../src/app/(tabs)/settings';
import { en } from '../src/core/i18n';
const mockSave = jest.fn().mockResolvedValue(undefined);
const mockSettings = {
  goal: 2000,
  waterGoal: 2000,
  language: 'en',
  consent: false,
  model: 'gemini-3.5-flash-lite',
  macroGoals: { protein: 100, carbs: 250, fat: 65 },
};
jest.mock('../src/state/AppProvider', () => ({
  useApp: () => ({
    settings: mockSettings,
    apiKey: 'saved-key',
    updateSettings: mockSave,
    clear: jest.fn(),
    aiBusy: false,
    t: require('../src/core/i18n').en,
  }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useFocusEffect: (callback: () => void) =>
    require('react').useEffect(callback, [callback]),
}));
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../src/components/AiUsageHistory', () => ({
  AiUsageHistory: () => null,
}));
jest.mock('../src/components/LanguageSelect', () => ({
  LanguageSelect: () => null,
}));

test('tabs reveal relevant settings and save only the current section', async () => {
  await render(<SettingsScreen />);
  expect(screen.getByLabelText(`${en.goal} (${en.kcal})`)).toBeTruthy();
  expect(screen.queryByLabelText(en.key)).toBeNull();
  await fireEvent.changeText(
    screen.getByLabelText(`${en.goal} (${en.kcal})`),
    '2200',
  );
  await fireEvent.press(
    screen.getByRole('button', { name: en.appSettingsTab }),
  );
  expect(screen.queryByLabelText(`${en.goal} (${en.kcal})`)).toBeNull();
  await fireEvent.changeText(
    screen.getByLabelText(en.model),
    'different-model',
  );
  await fireEvent.press(screen.getByRole('button', { name: en.saveSettings }));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'different-model', goal: 2000 }),
      'saved-key',
    ),
  );
  await fireEvent.press(screen.getByRole('button', { name: en.accountTab }));
  expect(screen.getByLabelText(`${en.goal} (${en.kcal})`).props.value).toBe(
    '2200',
  );
  await fireEvent.press(screen.getByRole('button', { name: en.saveSettings }));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 2200, model: 'gemini-3.5-flash-lite' }),
      undefined,
    ),
  );
});
