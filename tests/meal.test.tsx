import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import MealScreen from '../src/app/meal';
import { en } from '../src/core/i18n';
import { AnalysisError } from '../src/core/nutrition';
import { analyzePhoto } from '../src/services/gemini';
import { pickPhoto } from '../src/services/photos';
const mockSaveMeal = jest.fn();
const mockBack = jest.fn();
const mockConfirm = jest.fn();
const mockApp = {
  meals: [],
  apiKey: 'key',
  settings: {
    goal: 2000,
    language: 'en',
    model: 'gemini-3.5-flash-lite',
    consent: true,
  },
  t: en,
  saveMeal: mockSaveMeal,
  deleteMeal: jest.fn(),
  updateSettings: jest.fn(),
};
jest.mock('../src/state/AppProvider', () => ({ useApp: () => mockApp }));
jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    canGoBack: () => true,
    push: jest.fn(),
    replace: jest.fn(),
  },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ day: '2026-10-02' }),
}));
jest.mock('expo-router/react-navigation', () => ({
  useNavigation: () => ({ dispatch: jest.fn() }),
  usePreventRemove: jest.fn(),
}));
jest.mock('expo-crypto', () => ({
  randomUUID: (() => {
    let i = 0;
    return () => `id-${i++}`;
  })(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../src/services/photos', () => ({
  pickPhoto: jest.fn(),
  disposePhoto: jest.fn(),
}));
jest.mock('../src/services/gemini', () => ({ analyzePhoto: jest.fn() }));
jest.mock('../src/components/confirm', () => ({
  confirmAction: (...args: unknown[]) => mockConfirm(...args),
}));
beforeEach(() => {
  mockSaveMeal.mockReset();
  jest.mocked(analyzePhoto).mockReset();
  mockConfirm.mockReset().mockResolvedValue(true);
  mockApp.settings.consent = true;
  mockBack.mockClear();
  jest
    .mocked(pickPhoto)
    .mockResolvedValue({ uri: 'file:///photo.jpg', base64: 'image' } as never);
});
async function getPhoto() {
  await fireEvent.press(screen.getByText(en.gallery));
  await screen.findByText(en.analyze);
}
test('photo analysis remains a draft; edited portions persist once', async () => {
  jest.mocked(analyzePhoto).mockResolvedValue({
    name: 'Rice',
    notes: '',
    ingredients: [
      {
        id: 'rice',
        name: 'Rice',
        grams: 200,
        kcal: 260,
        protein: 5,
        fat: 1,
        carbs: 56,
      },
    ],
  });
  let finish: (() => void) | undefined;
  mockSaveMeal.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await render(<MealScreen />);
  await getPhoto();
  await fireEvent.press(screen.getByText(en.analyze));
  await waitFor(() =>
    expect(screen.getByLabelText(en.name).props.value).toBe('Rice'),
  );
  expect(mockSaveMeal).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText(en.grams), '');
  await fireEvent.changeText(screen.getByLabelText(en.grams), '100');
  await fireEvent.press(screen.getByText(en.save));
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() => expect(mockSaveMeal).toHaveBeenCalledTimes(1));
  expect(mockSaveMeal.mock.calls[0][0].ingredients[0].kcal).toBe(130);
  finish?.();
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
});
test('analysis failure preserves photo and manual draft for retry', async () => {
  jest.mocked(analyzePhoto).mockRejectedValue(new AnalysisError('network'));
  await render(<MealScreen />);
  await fireEvent.changeText(screen.getByLabelText(en.name), 'Lunch');
  await getPhoto();
  await fireEvent.press(screen.getByText(en.analyze));
  await screen.findByText(en.networkError);
  expect(screen.getByLabelText(en.name).props.value).toBe('Lunch');
  expect(screen.getByLabelText(en.photo)).toBeTruthy();
  expect(mockSaveMeal).not.toHaveBeenCalled();
});

test('declining photo consent sends no analysis request', async () => {
  mockApp.settings.consent = false;
  mockConfirm.mockResolvedValue(false);
  await render(<MealScreen />);
  await getPhoto();
  await fireEvent.press(screen.getByText(en.analyze));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(analyzePhoto).not.toHaveBeenCalled();
  expect(mockSaveMeal).not.toHaveBeenCalled();
});
test('manual logging works without calling Gemini', async () => {
  mockSaveMeal.mockResolvedValue(undefined);
  await render(<MealScreen />);
  await fireEvent.changeText(screen.getByLabelText(en.name), 'Lunch');
  await fireEvent.changeText(screen.getByLabelText(en.ingredient), 'Rice');
  await fireEvent.changeText(screen.getByLabelText(en.kcal), '130');
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(mockSaveMeal.mock.calls[0][0].source).toBe('manual');
  expect(analyzePhoto).not.toHaveBeenCalled();
});
test('a persistence failure keeps the meal draft for retry', async () => {
  mockSaveMeal.mockRejectedValue(new Error('disk full'));
  await render(<MealScreen />);
  await fireEvent.changeText(screen.getByLabelText(en.name), 'Lunch');
  await fireEvent.changeText(screen.getByLabelText(en.ingredient), 'Rice');
  await fireEvent.press(screen.getByText(en.save));
  await screen.findByText(en.storageError);
  expect(screen.getByLabelText(en.name).props.value).toBe('Lunch');
  expect(mockBack).not.toHaveBeenCalled();
});
