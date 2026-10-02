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
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
beforeEach(() => mockSave.mockReset().mockResolvedValue(undefined));
test('saves profile and calculated target while preserving manual mode', async () => {
  await render(<ProfileForm initial />);
  for (const [label, value] of [
    [en.age, '30'],
    [en.height, '180'],
    [en.weight, '80'],
  ])
    await fireEvent.changeText(screen.getByLabelText(label), value);
  await fireEvent.press(screen.getByRole('button', { name: en.male }));
  await fireEvent.press(screen.getByRole('button', { name: en.activity2 }));
  await fireEvent.press(screen.getByRole('button', { name: en.lose }));
  await fireEvent.press(screen.getByRole('button', { name: en.saveSettings }));
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        goal: 2884,
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
test('invalid input cannot save a profile', async () => {
  await render(<ProfileForm initial />);
  await fireEvent.press(screen.getByRole('button', { name: en.saveSettings }));
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
