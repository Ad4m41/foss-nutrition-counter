import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { ProfileForm } from '../src/components/ProfileForm';
import { en } from '../src/core/i18n';
const mockSave = jest.fn();
jest.mock('../src/state/AppProvider', () => ({
  useApp: () => ({
    settings: {
      goal: 2000,
      language: 'en',
      consent: false,
      model: 'gemini-3.5-flash-lite',
      skipKeySetup: true,
    },
    updateSettings: mockSave,
    t: require('../src/core/i18n').en,
  }),
}));
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
beforeEach(() => mockSave.mockReset().mockResolvedValue(undefined));
test('saves profile and calculated target while preserving manual mode', async () => {
  await render(<ProfileForm initial />);
  for (const [label, value] of [
    [en.height, '180'],
    [en.weight, '80'],
  ])
    await fireEvent.changeText(screen.getByLabelText(label), value);
  await fireEvent.press(screen.getByRole('button', { name: en.male }));
  await fireEvent.press(screen.getByRole('button', { name: en.continue }));
  await fireEvent.press(screen.getByRole('button', { name: en.activity2 }));
  await fireEvent.press(screen.getByRole('button', { name: en.continue }));
  await fireEvent.press(screen.getByRole('button', { name: en.lose }));
  await fireEvent.press(screen.getByRole('button', { name: en.saveSettings }));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: 2884,
        macroGoals: { protein: 136, carbs: 369, fat: 96 },
        skipKeySetup: true,
        profileSetupDone: true,
        profile: expect.objectContaining({
          activity: 2,
          objective: 'lose',
          weight: 80,
        }),
      }),
    ),
  );
});
test('invalid body data cannot advance', async () => {
  await render(<ProfileForm initial />);
  await fireEvent.press(screen.getByRole('button', { name: en.continue }));
  expect(screen.getByText(en.invalidProfile)).toBeTruthy();
  expect(mockSave).not.toHaveBeenCalled();
});
test('skip completes onboarding without inventing personal data', async () => {
  await render(<ProfileForm initial />);
  await fireEvent.press(screen.getByRole('button', { name: en.skipProfile }));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ profileSetupDone: true, goal: 2000 }),
    ),
  );
  expect(mockSave.mock.calls[0][0].profile).toBeUndefined();
});

test('moving back keeps the chosen age, sex and measurements', async () => {
  await render(<ProfileForm initial />);
  await fireEvent.press(screen.getByRole('button', { name: `${en.age} +1` }));
  await fireEvent.changeText(screen.getByLabelText(en.height), '180');
  await fireEvent.changeText(screen.getByLabelText(en.weight), '80');
  await fireEvent.press(screen.getByRole('button', { name: en.male }));
  await fireEvent.press(screen.getByRole('button', { name: en.continue }));
  await fireEvent.press(screen.getByRole('button', { name: en.back }));
  expect(screen.getByLabelText(en.age).props.accessibilityValue.now).toBe(31);
  expect(screen.getByLabelText(en.weight).props.value).toBe('80');
  expect(
    screen.getByRole('button', { name: en.male }).props.accessibilityState
      .selected,
  ).toBe(true);
});
