import React from 'react';
import { AppState, Text, type AppStateStatus } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { KeyGate } from '../src/components/KeyGate';
import { en } from '../src/core/i18n';
import { checkApiKey } from '../src/services/gemini';
const mockUpdate = jest.fn();
const mockApp = {
  apiKey: '',
  settings: {
    goal: 2000,
    language: 'en',
    model: 'gemini-3.5-flash-lite',
    consent: false,
    skipKeySetup: false,
  },
  updateSettings: mockUpdate,
  t: en,
};
jest.mock('../src/state/AppProvider', () => ({ useApp: () => mockApp }));
jest.mock('../src/services/gemini', () => ({ checkApiKey: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
const mount = () =>
  render(
    <KeyGate>
      <Text>Diary content</Text>
    </KeyGate>,
  );
beforeEach(() => {
  jest
    .spyOn(AppState, 'addEventListener')
    .mockImplementation(() => ({ remove: jest.fn() }));
  mockApp.apiKey = '';
  mockApp.settings.skipKeySetup = false;
  mockUpdate.mockReset().mockResolvedValue(undefined);
  jest.mocked(checkApiKey).mockReset().mockResolvedValue('valid');
});
test('first launch presents key setup and hides the diary', async () => {
  await mount();
  expect(screen.getByText(en.setupTitle)).toBeTruthy();
  expect(screen.queryByText('Diary content')).toBeNull();
  expect(checkApiKey).not.toHaveBeenCalled();
});
test('manual mode bypasses setup on subsequent launches', async () => {
  mockApp.settings.skipKeySetup = true;
  await mount();
  expect(screen.getByText('Diary content')).toBeTruthy();
  expect(screen.queryByText(en.setupTitle)).toBeNull();
});
test('skip persists manual mode and removes the stored key', async () => {
  await mount();
  await fireEvent.press(screen.getByRole('button', { name: en.skipKey }));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ skipKeySetup: true }),
      '',
    ),
  );
});
test.each(['valid', 'limited', 'unavailable'] as const)(
  'saved key: %s opens diary',
  async (status) => {
    mockApp.apiKey = 'saved-key';
    jest.mocked(checkApiKey).mockResolvedValue(status);
    await mount();
    await waitFor(() => expect(screen.getByText('Diary content')).toBeTruthy());
    expect(mockUpdate).not.toHaveBeenCalled();
  },
);
test('revoked key returns to setup without erasing data', async () => {
  mockApp.apiKey = 'expired';
  jest.mocked(checkApiKey).mockResolvedValue('invalid');
  await mount();
  await waitFor(() => expect(screen.getByText(en.invalidKey)).toBeTruthy());
  expect(screen.queryByText('Diary content')).toBeNull();
  expect(mockUpdate).not.toHaveBeenCalled();
});
test.each(['valid', 'limited'] as const)(
  'new key: %s is accepted',
  async (status) => {
    jest.mocked(checkApiKey).mockResolvedValue(status);
    await mount();
    await fireEvent.changeText(screen.getByLabelText(en.key), ' new-key ');
    await fireEvent.press(screen.getByRole('button', { name: en.checkKey }));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ skipKeySetup: false }),
        'new-key',
      ),
    );
  },
);
test.each(['invalid', 'unavailable'] as const)(
  'new key: %s stays editable and is not saved',
  async (status) => {
    jest.mocked(checkApiKey).mockResolvedValue(status);
    await mount();
    await fireEvent.changeText(screen.getByLabelText(en.key), 'bad');
    await fireEvent.press(screen.getByRole('button', { name: en.checkKey }));
    await waitFor(() =>
      expect(
        screen.getByText(
          status === 'invalid' ? en.invalidKey : en.keyUnavailable,
        ),
      ).toBeTruthy(),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  },
);

test.each(['limited', 'invalid'] as const)(
  'foreground rechecks saved key: %s',
  async (status) => {
    let foreground: ((state: AppStateStatus) => void) | undefined;
    const listener = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_event, callback) => {
        foreground = callback;
        return { remove: jest.fn() };
      });
    try {
      mockApp.apiKey = 'saved-key';
      await mount();
      await waitFor(() =>
        expect(screen.getByText('Diary content')).toBeTruthy(),
      );
      jest.mocked(checkApiKey).mockResolvedValue(status);
      await act(async () => {
        foreground?.('background');
        foreground?.('inactive');
        foreground?.('active');
      });
      await waitFor(() => expect(checkApiKey).toHaveBeenCalledTimes(2));
      if (status === 'invalid') {
        await waitFor(() =>
          expect(screen.getByText(en.invalidKey)).toBeTruthy(),
        );
        expect(screen.queryByText('Diary content')).toBeNull();
      } else {
        await waitFor(() =>
          expect(screen.getByText('Diary content')).toBeTruthy(),
        );
      }
      expect(mockUpdate).not.toHaveBeenCalled();
    } finally {
      listener.mockRestore();
    }
  },
);

test('saved-key validation shows only the startup logo, then opens the diary', async () => {
  mockApp.apiKey = 'saved-key';
  let finish: ((status: 'valid') => void) | undefined;
  jest.mocked(checkApiKey).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await mount();
  expect(screen.getByLabelText(en.startupLoading)).toBeTruthy();
  expect(screen.queryByText(en.setupTitle)).toBeNull();
  expect(screen.queryByLabelText(en.key)).toBeNull();
  await act(async () => finish?.('valid'));
  await waitFor(() => expect(screen.getByText('Diary content')).toBeTruthy());
  expect(screen.queryByLabelText(en.startupLoading)).toBeNull();
});
