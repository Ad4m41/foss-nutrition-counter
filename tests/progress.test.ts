import { progressSegments } from '../src/core/progress';
test.each([
  [40, 80, { within: 0.5, excess: 0 }],
  [80, 80, { within: 1, excess: 0 }],
  [100, 80, { within: 0.8, excess: 0.2 }],
  [160, 80, { within: 0.5, excess: 0.5 }],
  [0, 80, { within: 0, excess: 0 }],
  [-5, 80, { within: 0, excess: 0 }],
  [100, undefined, { within: 0, excess: 0 }],
  [100, 0, { within: 0, excess: 0 }],
  [Infinity, 80, { within: 0, excess: 0 }],
])('scales %s against %s', (value, goal, expected) => {
  expect(progressSegments(value, goal)).toEqual(expected);
});
