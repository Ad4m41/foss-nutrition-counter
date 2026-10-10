import React, { useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AgeWheel } from '../src/components/AgeWheel';

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock'),
);

jest.mock('../src/state/AppProvider', () => ({
  useApp: () => ({ t: require('../src/core/i18n').en }),
}));
jest.mock('@expo/vector-icons/Ionicons', () => 'Icon');
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
}));

function ControlledWheel() {
  const [age, setAge] = useState(19);
  return <AgeWheel label="Age" value={age} onChange={setAge} />;
}
const position = (age: number) => ({
  nativeEvent: {
    contentOffset: {
      x: 0,
      y:
        (age - 18) *
        screen.getByTestId('age-wheel-scroll').props.snapToInterval,
    },
  },
});

afterEach(() => jest.useRealTimers());

test('fast flick 19 to 25 keeps momentum position after drag release and timeouts', async () => {
  jest.useFakeTimers();
  await render(<ControlledWheel />);
  const wheel = () => screen.getByTestId('age-wheel-scroll');
  await fireEvent(wheel(), 'scrollEndDrag', position(19));
  await fireEvent(wheel(), 'scroll', position(22));
  await fireEvent(wheel(), 'scroll', position(25));
  await act(() => jest.advanceTimersByTime(200));
  // Continuous scroll runs on the UI thread; React receives the settled age.
  expect(screen.getByLabelText('Age').props.accessibilityValue.now).toBe(19);
  expect(wheel().props.contentOffset.y).toBe(wheel().props.snapToInterval);
  await fireEvent(wheel(), 'momentumScrollEnd', position(25));
  expect(screen.getByLabelText('Age').props.accessibilityValue.now).toBe(25);
  jest.useRealTimers();
});

test('drag without momentum saves its final position and accessible buttons still adjust it', async () => {
  await render(<ControlledWheel />);
  await fireEvent(
    screen.getByTestId('age-wheel-scroll'),
    'scrollEndDrag',
    position(25),
  );
  expect(screen.getByLabelText('Age').props.accessibilityValue.now).toBe(25);
  await fireEvent.press(screen.getByLabelText('Age +1'));
  expect(screen.getByLabelText('Age').props.accessibilityValue.now).toBe(26);
});
