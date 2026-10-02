import { parseMacroGoals } from '../src/core/macroGoals';
test('keeps optional macro targets unset', () => {
  expect(parseMacroGoals({ protein: '', carbs: ' ', fat: '' })).toEqual({});
});
test('accepts localized decimal targets and partial goals', () => {
  expect(parseMacroGoals({ protein: '120', carbs: '', fat: '65,5' })).toEqual({
    protein: 120,
    fat: 65.5,
  });
});
test.each(['0', '-1', 'text', 'Infinity'])(
  'rejects invalid macro goal %s',
  (value) => {
    expect(parseMacroGoals({ protein: value, carbs: '', fat: '' })).toBeNull();
  },
);
