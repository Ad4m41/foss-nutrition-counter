import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { Overlay } from '../src/components/Overlay';

const mockCompletions: ((finished: boolean) => void)[] = [];
jest.mock('react-native-reanimated', () => ({
  ...require('react-native-reanimated/mock'),
  useReducedMotion: () => false,
  cubicBezier: () => 'ease-out',
  withTiming: (
    value: number,
    _config: unknown,
    complete: (finished: boolean) => void,
  ) => {
    mockCompletions.push(complete);
    return value;
  },
}));
jest.mock('react-native-worklets', () => ({
  ...require('react-native-worklets/src/mock'),
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]) =>
    fn(...args),
}));
jest.mock('../src/state/AppProvider', () => ({
  useApp: () => ({ t: require('../src/core/i18n').en }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
beforeEach(() => {
  mockCompletions.length = 0;
});
const panel = (open: boolean) => (
  <Overlay open={open} onClose={() => {}} closeLabel="Close">
    <Text>Panel content</Text>
  </Overlay>
);

test('a native modal retains its content until exit finishes', async () => {
  const view = await render(panel(true));
  await view.rerender(panel(false));
  expect(screen.getByText('Panel content')).toBeTruthy();
  await act(() => mockCompletions[mockCompletions.length - 1](true));
  expect(screen.queryByText('Panel content')).toBeNull();
});
test('an interrupted close does not unmount a reopened panel', async () => {
  const view = await render(panel(true));
  await view.rerender(panel(false));
  const closing = mockCompletions[mockCompletions.length - 1];
  await view.rerender(panel(true));
  await act(() => closing(false));
  expect(screen.getByText('Panel content')).toBeTruthy();
});
