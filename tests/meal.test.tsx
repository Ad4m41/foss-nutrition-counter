import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import MealScreen from '../src/app/meal';
import { en } from '../src/core/i18n';
import { AnalysisError, Meal } from '../src/core/nutrition';
import { analyzePhoto } from '../src/services/gemini';
import {
  disposePhoto,
  pickPhotos,
  recoverPhotos,
} from '../src/services/photos';
import { validateQuestions } from '../src/core/clarification';
const mockPrevented: Record<string, { preventRemove: boolean }> = {};
const mockParams: {
  day: string;
  capture?: string;
  mode?: string;
  id?: string;
} = {
  day: '2026-10-02',
};
const mockSaveMeal = jest.fn();
const mockBack = jest.fn();
const mockConfirm = jest.fn();
const mockApp = {
  meals: [] as Meal[],
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
  trackAi: (_kind: unknown, request: () => Promise<unknown>) => request(),
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
  useLocalSearchParams: () => mockParams,
  useRoute: () => ({ key: 'meal-route' }),
}));
jest.mock('expo-router/react-navigation', () => ({
  useNavigation: () => ({ dispatch: jest.fn() }),
  usePreventRemove: jest.fn(),
  usePreventRemoveContext: () => ({ preventedRoutes: mockPrevented }),
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
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('@react-native-community/slider', () => 'Slider');
jest.mock('../src/services/photos', () => ({
  recoverPhotos: jest.fn().mockResolvedValue([]),
  pickPhotos: jest.fn(),
  disposePhoto: jest.fn(),
  photoBase64: jest.fn().mockResolvedValue('retained-image'),
}));
jest.mock('../src/services/gemini', () => ({ analyzePhoto: jest.fn() }));
jest.mock('../src/components/confirm', () => ({
  confirmAction: (...args: unknown[]) => mockConfirm(...args),
}));
beforeEach(() => {
  delete mockParams.id;
  mockApp.meals = [];
  delete mockPrevented['meal-route'];
  delete mockParams.capture;
  delete mockParams.mode;
  jest.mocked(pickPhotos).mockClear();
  jest.mocked(recoverPhotos).mockReset().mockResolvedValue([]);
  jest.mocked(disposePhoto).mockClear();
  mockSaveMeal.mockReset();
  jest.mocked(analyzePhoto).mockReset();
  mockConfirm.mockReset().mockResolvedValue(true);
  mockApp.settings.consent = true;
  mockBack.mockClear();
  jest
    .mocked(pickPhotos)
    .mockResolvedValue([
      { uri: 'file:///photo.jpg', base64: 'image' },
    ] as never);
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
        salt: 2,
        fiber: 4,
        sugars: 1,
        saturatedFat: 0.2,
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
  expect(mockSaveMeal.mock.calls[0][0].ingredients[0]).toMatchObject({
    salt: 1,
    fiber: 2,
    sugars: 0.5,
    saturatedFat: 0.1,
  });
  finish?.();
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
});
test('analysis failure preserves photo and manual draft for retry', async () => {
  jest.mocked(analyzePhoto).mockRejectedValue(new AnalysisError('network'));
  mockParams.mode = 'manual';
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
  mockParams.mode = 'manual';
  await render(<MealScreen />);
  await fireEvent.changeText(screen.getByLabelText(en.name), 'Lunch');
  await fireEvent.changeText(screen.getByLabelText(en.ingredient), 'Rice');
  await fireEvent.changeText(screen.getByLabelText(en.kcal), '130');
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(mockSaveMeal.mock.calls[0][0].source).toBe('manual');
  expect(mockSaveMeal.mock.calls[0][0].ingredients[0].salt).toBeNull();
  expect(analyzePhoto).not.toHaveBeenCalled();
});
test('a persistence failure keeps the meal draft for retry', async () => {
  mockSaveMeal.mockRejectedValue(new Error('disk full'));
  mockParams.mode = 'manual';
  await render(<MealScreen />);
  await fireEvent.changeText(screen.getByLabelText(en.name), 'Lunch');
  await fireEvent.changeText(screen.getByLabelText(en.ingredient), 'Rice');
  await fireEvent.press(screen.getByText(en.save));
  await screen.findByText(en.storageError);
  expect(screen.getByLabelText(en.name).props.value).toBe('Lunch');
  expect(mockBack).not.toHaveBeenCalled();
});

test('add-from-camera opens the camera once and keeps the selected day', async () => {
  mockParams.capture = 'camera';
  mockParams.mode = 'manual';
  await render(<MealScreen />);
  await waitFor(() => expect(pickPhotos).toHaveBeenCalledWith(true, 4));
  expect(pickPhotos).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText(en.date).props.value).toBe('2026-10-02');
});

const estimate = {
  name: 'Rice',
  notes: 'Portion estimated.',
  ingredients: [
    {
      id: 'rice',
      name: 'Rice',
      grams: 200,
      kcal: 260,
      protein: 5,
      carbs: 56,
      fat: 1,
      saturatedFat: null,
      sugars: null,
      fiber: null,
      salt: null,
    },
  ],
};
const clarificationQuestions = validateQuestions([
  {
    id: 'oil',
    type: 'yesNo',
    prompt: 'Was oil added?',
    reason: 'Oil affects energy.',
    priority: 'recommended',
  },
  {
    id: 'portion',
    type: 'slider',
    prompt: 'How many grams?',
    reason: 'Portion size is unclear.',
    priority: 'optional',
    min: 0,
    max: 500,
    step: 5,
    unit: 'g',
  },
  {
    id: 'food',
    type: 'text',
    prompt: 'Which kind of rice?',
    reason: 'The variety is unclear.',
    priority: 'optional',
  },
]);
async function startQuestions() {
  jest
    .mocked(analyzePhoto)
    .mockResolvedValueOnce({ ...estimate, questions: clarificationQuestions });
  await render(<MealScreen />);
  await getPhoto();
  await fireEvent.changeText(
    screen.getByLabelText(en.mealDescription),
    'Rice with vegetables',
  );
  await fireEvent.press(screen.getByText(en.analyze));
  await screen.findByText(en.aiQuestionsTitle);
}
test('new meals start with AI input and keep the manual form out of the way', async () => {
  await render(<MealScreen />);
  expect(screen.getByLabelText(en.mealDescription)).toBeTruthy();
  expect(screen.queryByLabelText(en.ingredient)).toBeNull();
  expect(screen.queryByText(en.save)).toBeNull();
  await fireEvent.press(screen.getByText(en.manual));
  expect(screen.getByLabelText(en.ingredient)).toBeTruthy();
});
test('recommended questions can be skipped without a second request or losing the estimate', async () => {
  mockSaveMeal.mockResolvedValue(undefined);
  await startQuestions();
  expect(screen.getByText(en.questionRecommended)).toBeTruthy();
  expect(
    screen.getByRole('button', { name: en.refineEstimate }).props
      .accessibilityState.disabled,
  ).toBe(true);
  await fireEvent.press(screen.getByText(en.skipQuestions));
  expect(screen.getByLabelText(en.name).props.value).toBe('Rice');
  expect(analyzePhoto).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() => expect(mockSaveMeal).toHaveBeenCalledTimes(1));
  expect(mockSaveMeal.mock.calls[0][0]).toMatchObject({
    source: 'ai',
    name: 'Rice',
    notes: expect.stringContaining(en.questionsSkippedNote),
  });
});
test('answers send the original photo and description once, with untouched slider omitted', async () => {
  await startQuestions();
  expect(screen.getByText(en.questionUnanswered)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: en.no }));
  await fireEvent.changeText(
    screen.getByLabelText(en.yourAnswer),
    'Brown rice',
  );
  jest.mocked(analyzePhoto).mockResolvedValueOnce({
    ...estimate,
    name: 'Brown rice',
    questions: clarificationQuestions,
  });
  await fireEvent.press(screen.getByText(en.refineEstimate));
  await waitFor(() =>
    expect(screen.getByLabelText(en.name).props.value).toBe('Brown rice'),
  );
  const second = jest.mocked(analyzePhoto).mock.calls[1][0];
  expect(second).toMatchObject({
    images: ['image'],
    description: 'Rice with vegetables',
    clarification: { answers: { oil: false, food: 'Brown rice' } },
  });
  expect(second.clarification?.answers).not.toHaveProperty('portion');
  expect(analyzePhoto).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(en.aiQuestionsTitle)).toBeNull();
});
test('failed refinement preserves answers and still allows skipping to the first estimate', async () => {
  await startQuestions();
  await fireEvent.changeText(
    screen.getByLabelText(en.yourAnswer),
    'Brown rice',
  );
  jest
    .mocked(analyzePhoto)
    .mockRejectedValueOnce(new AnalysisError('localLimit'));
  await fireEvent.press(screen.getByText(en.refineEstimate));
  await screen.findByText(en.localLimitError);
  expect(screen.getByLabelText(en.yourAnswer).props.value).toBe('Brown rice');
  await fireEvent.press(screen.getByText(en.skipQuestions));
  expect(screen.getByLabelText(en.name).props.value).toBe('Rice');
});
test('an explicit zero on the slider is kept as an answer', async () => {
  await startQuestions();
  await fireEvent(screen.getByLabelText('How many grams?'), 'valueChange', 0);
  jest.mocked(analyzePhoto).mockResolvedValueOnce(estimate);
  await fireEvent.press(screen.getByText(en.refineEstimate));
  await screen.findByLabelText(en.name);
  expect(
    jest.mocked(analyzePhoto).mock.calls[1][0].clarification?.answers,
  ).toEqual({ portion: 0 });
});
test('text-only meal input can run AI and bypasses the questions step when confident', async () => {
  jest
    .mocked(analyzePhoto)
    .mockResolvedValueOnce({ ...estimate, questions: [] });
  await render(<MealScreen />);
  await fireEvent.changeText(
    screen.getByLabelText(en.mealDescription),
    '200 g cooked rice',
  );
  await fireEvent.press(screen.getByText(en.analyze));
  await screen.findByLabelText(en.name);
  expect(analyzePhoto).toHaveBeenCalledWith(
    expect.objectContaining({
      images: [],
      description: '200 g cooked rice',
    }),
  );
  expect(screen.queryByText(en.aiQuestionsTitle)).toBeNull();
});

test('successful save waits for the native removal guard before returning', async () => {
  mockParams.mode = 'manual';
  mockPrevented['meal-route'] = { preventRemove: true };
  mockSaveMeal.mockResolvedValue(undefined);
  const view = await render(<MealScreen />);
  await fireEvent.changeText(screen.getByLabelText(en.name), 'Lunch');
  await fireEvent.changeText(screen.getByLabelText(en.ingredient), 'Rice');
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() => expect(mockSaveMeal).toHaveBeenCalledTimes(1));
  expect(mockBack).not.toHaveBeenCalled();
  delete mockPrevented['meal-route'];
  await view.rerender(<MealScreen />);
  await waitFor(() => expect(mockBack).toHaveBeenCalledTimes(1));
});

test('saved meal correction sends retained photo and current portions; saves only on confirmation', async () => {
  mockParams.id = 'saved-meal';
  mockApp.meals = [
    {
      ...estimate,
      id: 'saved-meal',
      day: '2026-10-02',
      createdAt: '2026-10-02T12:00:00Z',
      source: 'ai',
      photoUri: 'file:///retained.jpg',
    },
  ];
  jest
    .mocked(analyzePhoto)
    .mockResolvedValue({ ...estimate, name: 'Chicken', questions: [] });
  mockSaveMeal.mockResolvedValue(undefined);
  await render(<MealScreen />);
  await fireEvent.changeText(
    screen.getByLabelText(en.estimateCorrection),
    'Chicken, not pork. Keep 200 g.',
  );
  await fireEvent.press(screen.getByText(en.reestimate));
  await waitFor(() =>
    expect(screen.getByLabelText(en.name).props.value).toBe('Chicken'),
  );
  const sent = jest.mocked(analyzePhoto).mock.calls[0][0];
  expect(sent.images).toEqual(['retained-image']);
  expect(JSON.parse(sent.revision!)).toMatchObject({
    correction: 'Chicken, not pork. Keep 200 g.',
    previousEstimate: {
      ingredients: [expect.objectContaining({ grams: 200 })],
    },
  });
  expect(mockSaveMeal).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() =>
    expect(mockSaveMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'saved-meal',
        name: 'Chicken',
        day: '2026-10-02',
        createdAt: '2026-10-02T12:00:00Z',
      }),
    ),
  );
});

test('failed correction preserves existing estimate and correction for retry', async () => {
  mockParams.id = 'saved-meal';
  mockApp.meals = [
    {
      ...estimate,
      id: 'saved-meal',
      day: '2026-10-02',
      createdAt: '2026-10-02T12:00:00Z',
      source: 'ai',
    },
  ];
  jest.mocked(analyzePhoto).mockRejectedValue(new AnalysisError('network'));
  await render(<MealScreen />);
  await fireEvent.changeText(
    screen.getByLabelText(en.estimateCorrection),
    'Chicken, not pork',
  );
  await fireEvent.press(screen.getByText(en.reestimate));
  await screen.findByText(en.networkError);
  expect(screen.getByLabelText(en.name).props.value).toBe('Rice');
  expect(screen.getByLabelText(en.estimateCorrection).props.value).toBe(
    'Chicken, not pork',
  );
  expect(mockSaveMeal).not.toHaveBeenCalled();
});

test('restored Android camera result is shown without opening the camera a second time', async () => {
  mockParams.capture = 'camera';
  jest.mocked(recoverPhotos).mockResolvedValue([
    {
      uri: 'file:///recovered.jpg',
      base64: 'first-photo',
    },
  ] as never);
  await render(<MealScreen />);
  await waitFor(() =>
    expect(screen.getByLabelText(en.photo).props.source.uri).toBe(
      'file:///recovered.jpg',
    ),
  );
  expect(pickPhotos).not.toHaveBeenCalled();
  jest.mocked(analyzePhoto).mockResolvedValue(estimate);
  await fireEvent.press(screen.getByText(en.analyze));
  await screen.findByLabelText(en.name);
  expect(analyzePhoto).toHaveBeenCalledWith(
    expect.objectContaining({ images: ['first-photo'] }),
  );
});
test('updating the saved meal never disposes its retained photo', async () => {
  mockParams.id = 'saved-meal';
  const meal: Meal = {
    ...estimate,
    id: 'saved-meal',
    day: '2026-10-02',
    createdAt: '2026-10-02T12:00:00Z',
    source: 'ai',
    photoUri: 'file:///documents/meal-photos/saved.jpg',
  };
  mockApp.meals = [meal];
  const view = await render(<MealScreen />);
  mockApp.meals = [{ ...meal, notes: 'Updated by save' }];
  await view.rerender(<MealScreen />);
  await view.unmount();
  expect(disposePhoto).not.toHaveBeenCalled();
});

test('all selected photos reach AI, removed photos are omitted, and the remaining photos persist', async () => {
  jest.mocked(pickPhotos).mockResolvedValue([
    { uri: 'file:///dish.jpg', base64: 'dish' },
    { uri: 'file:///label.jpg', base64: 'label' },
  ] as never);
  jest.mocked(analyzePhoto).mockResolvedValue(estimate);
  mockSaveMeal.mockResolvedValue(undefined);
  await render(<MealScreen />);
  await getPhoto();
  expect(screen.getByLabelText(`${en.photo} 2`)).toBeTruthy();
  await fireEvent.press(screen.getByText(en.analyze));
  await screen.findByLabelText(en.name);
  expect(analyzePhoto).toHaveBeenCalledWith(
    expect.objectContaining({ images: ['dish', 'label'] }),
  );
  await fireEvent.press(screen.getByText(en.save));
  await waitFor(() =>
    expect(mockSaveMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        photoUri: 'file:///dish.jpg',
        photoUris: ['file:///dish.jpg', 'file:///label.jpg'],
      }),
    ),
  );
});
test('a removed draft photo is excluded from the AI request', async () => {
  jest.mocked(pickPhotos).mockResolvedValue([
    { uri: 'file:///dish.jpg', base64: 'dish' },
    { uri: 'file:///label.jpg', base64: 'label' },
  ] as never);
  jest.mocked(analyzePhoto).mockResolvedValue(estimate);
  await render(<MealScreen />);
  await getPhoto();
  await fireEvent.press(
    screen.getByRole('button', { name: `${en.removePhoto} 2` }),
  );
  await fireEvent.press(screen.getByText(en.analyze));
  await screen.findByLabelText(en.name);
  expect(analyzePhoto).toHaveBeenCalledWith(
    expect.objectContaining({ images: ['dish'] }),
  );
  expect(disposePhoto).toHaveBeenCalledWith('file:///label.jpg');
});
