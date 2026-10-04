import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ProductScreen from '../src/app/product';
import { en } from '../src/core/i18n';
import { AnalysisError } from '../src/core/nutrition';
import { analyzeProduct } from '../src/services/gemini';
const mockTrack = jest.fn((_kind, request) => request(jest.fn()));
const mockSaveMeal = jest.fn();
const mockConfirm = jest.fn();
const mockUpdate = jest.fn();
const mockApp = {
  apiKey: 'key',
  settings: { consent: true, model: 'gemini-test', language: 'en' },
  trackAi: mockTrack,
  saveMeal: mockSaveMeal,
  updateSettings: mockUpdate,
  t: en,
};
jest.mock('../src/state/AppProvider', () => ({ useApp: () => mockApp }));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  Stack: { Screen: () => null },
}));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('../src/services/gemini', () => ({ analyzeProduct: jest.fn() }));
jest.mock('../src/services/photos', () => ({
  pickPhoto: jest.fn(),
  disposePhoto: jest.fn(),
}));
jest.mock('../src/components/confirm', () => ({
  confirmAction: (...args: unknown[]) => mockConfirm(...args),
}));
beforeEach(() => {
  mockTrack
    .mockReset()
    .mockImplementation((_kind, request) => request(jest.fn()));
  mockSaveMeal.mockClear();
  mockUpdate.mockReset().mockResolvedValue(undefined);
  mockConfirm.mockReset().mockResolvedValue(true);
  mockApp.settings.consent = true;
  jest
    .mocked(analyzeProduct)
    .mockReset()
    .mockResolvedValue({
      name: 'Yogurt',
      summary: 'Plain yogurt offers protein.',
      strengths: ['Protein'],
      concerns: [],
      allergens: [],
      uncertainties: ['No label provided'],
      advice: 'Check the ingredients.',
    });
});
async function enterProduct() {
  await fireEvent.changeText(
    screen.getByLabelText(en.productDescription),
    'Yogurt',
  );
  await fireEvent.press(screen.getByText(en.productAnalyze));
}
test('checks a product without saving a meal, and shows qualified results', async () => {
  await render(<ProductScreen />);
  await enterProduct();
  await screen.findByText('Plain yogurt offers protein.');
  expect(mockTrack).toHaveBeenCalledWith('product', expect.any(Function));
  expect(analyzeProduct).toHaveBeenCalledWith(
    expect.objectContaining({
      description: 'Yogurt',
      onUsage: expect.any(Function),
    }),
  );
  expect(mockSaveMeal).not.toHaveBeenCalled();
  expect(screen.getByText(en.productEstimate)).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText(en.productDescription),
    'Different product',
  );
  expect(screen.queryByText('Plain yogurt offers protein.')).toBeNull();
});
test('requires content before making a request', async () => {
  await render(<ProductScreen />);
  await fireEvent.press(screen.getByText(en.productAnalyze));
  expect(screen.getByText(en.productInputMissing)).toBeTruthy();
  expect(mockTrack).not.toHaveBeenCalled();
});
test('a denied consent does not send or count an analysis', async () => {
  mockApp.settings.consent = false;
  mockConfirm.mockResolvedValue(false);
  await render(<ProductScreen />);
  await enterProduct();
  expect(mockTrack).not.toHaveBeenCalled();
  expect(analyzeProduct).not.toHaveBeenCalled();
});
test('a local limit error preserves the product draft', async () => {
  mockTrack.mockRejectedValue(new AnalysisError('localLimit'));
  await render(<ProductScreen />);
  await enterProduct();
  await screen.findByText(en.localLimitError);
  expect(screen.getByLabelText(en.productDescription).props.value).toBe(
    'Yogurt',
  );
  expect(analyzeProduct).not.toHaveBeenCalled();
});
test('unexpected analysis errors are not described as failed saving', async () => {
  jest
    .mocked(analyzeProduct)
    .mockRejectedValue(new TypeError('runtime API unavailable'));
  await render(<ProductScreen />);
  await enterProduct();
  await screen.findByText(en.analysisError);
  expect(screen.queryByText(en.storageError)).toBeNull();
  expect(screen.getByLabelText(en.productDescription).props.value).toBe(
    'Yogurt',
  );
});
