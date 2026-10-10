import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { WaterTracker } from '../src/components/WaterTracker';
const mockAdjust = jest.fn();
let mockWater = 0;
jest.mock('../src/state/AppProvider', () => ({
  useApp: () => ({
    water: { '2026-10-04': mockWater },
    settings: { waterGoal: 2000 },
    adjustWater: mockAdjust,
    t: require('../src/core/i18n').en,
  }),
}));
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
beforeEach(() => {
  mockWater = 0;
  mockAdjust.mockReset().mockResolvedValue(undefined);
});

test('water controls add and subtract 250 ml and disable subtraction at zero', async () => {
  const view = await render(<WaterTracker day="2026-10-04" />);
  await fireEvent.press(screen.getByRole('button', { name: '−250 ml' }));
  expect(mockAdjust).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: '+250 ml' }));
  await waitFor(() =>
    expect(mockAdjust).toHaveBeenCalledWith('2026-10-04', 250),
  );
  mockWater = 250;
  await view.rerender(<WaterTracker day="2026-10-04" />);
  await fireEvent.press(screen.getByRole('button', { name: '−250 ml' }));
  await waitFor(() =>
    expect(mockAdjust).toHaveBeenCalledWith('2026-10-04', -250),
  );
});

test('failed water save leaves the displayed amount and shows a recoverable error', async () => {
  mockWater = 500;
  mockAdjust.mockRejectedValueOnce(new Error('disk unavailable'));
  await render(<WaterTracker day="2026-10-04" />);
  await fireEvent.press(screen.getByRole('button', { name: '+250 ml' }));
  await waitFor(() =>
    expect(
      screen.getByText(require('../src/core/i18n').en.storageError),
    ).toBeTruthy(),
  );
  expect(screen.getByText(/500/)).toBeTruthy();
});
