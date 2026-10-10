import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PressFeedback } from '../src/components/PressFeedback';
import { feedback } from '../src/components/feedback';

jest.mock('../src/components/feedback', () => ({ feedback: jest.fn() }));
const onPress = jest.fn();
const onPressIn = jest.fn();
const event = (pageY = 50) => ({
  currentTarget: 1,
  persist: jest.fn(),
  nativeEvent: { pageX: 50, pageY, timestamp: Date.now() },
});
const button = () => screen.getByRole('button', { name: 'Save' });
const mount = () =>
  render(
    <PressFeedback
      accessibilityRole="button"
      haptic="press"
      onPress={onPress}
      onPressIn={onPressIn}
    >
      <Text>Save</Text>
    </PressFeedback>,
  );
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

async function start() {
  await fireEvent(button(), 'touchStart', event());
  await fireEvent(button(), 'responderGrant', event());
}

test('a scroll taking the responder before activation produces no press feedback', async () => {
  await mount();
  await start();
  await act(() => jest.advanceTimersByTime(40));
  await fireEvent(button(), 'responderTerminate', event(80));
  await act(() => jest.advanceTimersByTime(600));
  expect(onPressIn).not.toHaveBeenCalled();
  expect(feedback).not.toHaveBeenCalled();
  expect(onPress).not.toHaveBeenCalled();
  expect(button()).toHaveStyle({ transform: [{ scale: 1 }] });
});

test('a drag cancels pending visuals even before the scroll takes the responder', async () => {
  await mount();
  await start();
  await fireEvent(button(), 'touchMove', event(80));
  await act(() => jest.advanceTimersByTime(100));
  expect(onPressIn).not.toHaveBeenCalled();
  expect(button()).toHaveStyle({ transform: [{ scale: 1 }] });
  await fireEvent(button(), 'responderTerminate', event(80));
  expect(feedback).not.toHaveBeenCalled();
});

test('scrolling after a hold clears the scale without vibrating or committing', async () => {
  await mount();
  await start();
  await act(() => jest.advanceTimersByTime(100));
  expect(button()).toHaveStyle({ transform: [{ scale: 0.97 }] });
  expect(feedback).not.toHaveBeenCalled();
  await fireEvent(button(), 'touchMove', event(80));
  expect(button()).toHaveStyle({ transform: [{ scale: 1 }] });
  await fireEvent(button(), 'responderTerminate', event(80));
  expect(feedback).not.toHaveBeenCalled();
  expect(onPress).not.toHaveBeenCalled();
});

test('a quick tap commits immediately with one haptic and works after a cancelled scroll', async () => {
  await mount();
  await start();
  await fireEvent(button(), 'touchMove', event(80));
  await fireEvent(button(), 'responderTerminate', event(80));
  await start();
  await act(() => jest.advanceTimersByTime(30));
  await fireEvent(button(), 'responderRelease', event());
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(feedback).toHaveBeenCalledTimes(1);
  expect(feedback).toHaveBeenCalledWith('press');
});

test('accessibility activation still works after a cancelled touch gesture', async () => {
  await mount();
  await start();
  await fireEvent(button(), 'touchMove', event(80));
  await fireEvent(button(), 'responderTerminate', event(80));
  await fireEvent.press(button(), event());
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(feedback).toHaveBeenCalledTimes(1);
});
