import { Easing, cubicBezier } from 'react-native-reanimated';

/** Shared motion vocabulary; frequent interactions stay below 150 ms. */
export const motion = {
  press: 120,
  state: 180,
  enter: 240,
  exit: 180,
  easeOut: Easing.bezier(0.23, 1, 0.32, 1),
  easeSheet: Easing.bezier(0.32, 0.72, 0, 1),
  cssEaseOut: cubicBezier(0.23, 1, 0.32, 1),
};
