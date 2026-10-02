import {
  localDay,
  moveDay,
  parseNumber,
  resizePortion,
  totals,
  validDay,
  validateAnalysis,
  validIngredient,
} from '../src/core/nutrition';
const rice = {
  id: 'rice',
  name: 'Rice',
  grams: 200,
  kcal: 260,
  protein: 5.4,
  fat: 0.6,
  carbs: 56,
};
const output = {
  isFood: true,
  name: 'Rice bowl',
  notes: 'Portion estimated.',
  ingredients: [
    { ...rice, saturatedFat: null, sugars: null, fiber: null, salt: null },
  ],
};
test('resizing a portion scales all nutrients without changing the original', () => {
  expect(resizePortion(rice, 100)).toEqual({
    ...rice,
    grams: 100,
    kcal: 130,
    protein: 2.7,
    fat: 0.3,
    carbs: 28,
  });
  expect(rice.grams).toBe(200);
});
test.each([0, -1, NaN, Infinity])('rejects unusable portion %s', (grams) =>
  expect(() => resizePortion(rice, grams)).toThrow(),
);
test('totals handle empty days and multiple meal ingredients', () => {
  expect(totals([])).toEqual({
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    saturatedFat: 0,
    sugars: 0,
    fiber: 0,
    salt: 0,
  });
  expect(totals([rice, resizePortion(rice, 100)]).kcal).toBe(390);
});
test('uses local calendar date instead of UTC serialization', () => {
  const date = new Date(2026, 9, 2, 0, 5);
  expect(localDay(date)).toBe('2026-10-02');
  expect(moveDay('2026-01-01', -1)).toBe('2025-12-31');
  expect(moveDay('2028-02-28', 1)).toBe('2028-02-29');
});
test.each(['2026-02-29', '2026-13-01', '2026-2-01', 'x'])(
  'rejects invalid date %s',
  (value) => expect(validDay(value)).toBe(false),
);
test('supports Polish decimal input without silently accepting blanks', () => {
  expect(parseNumber('12,5')).toBe(12.5);
  expect(parseNumber('')).toBeNaN();
});
test('validates AI output and supplies local ingredient IDs', () =>
  expect(validateAnalysis(output).ingredients[0].id).toBe('ai-0'));
test.each([
  { ...output, isFood: false },
  { ...output, ingredients: [] },
  { ...output, ingredients: [{ ...rice, kcal: -1 }] },
  { ...output, ingredients: [{ ...rice, grams: 0 }] },
  { ...output, ingredients: [{ ...rice, protein: '5' }] },
])('rejects unusable AI result', (result) =>
  expect(() => validateAnalysis(result)).toThrow(),
);

test('portion changes scale salt, fiber, sugars and saturated fat', () => {
  const result = resizePortion(
    { ...rice, salt: 1.2, fiber: 4, sugars: 2, saturatedFat: 0.4 },
    100,
  );
  expect(result).toMatchObject({
    salt: 0.6,
    fiber: 2,
    sugars: 1,
    saturatedFat: 0.2,
  });
});
test('legacy meals preserve missing values instead of inventing zero', () => {
  expect(validIngredient(rice)).toBe(true);
  expect(totals([rice]).salt).toBeNull();
  expect(resizePortion({ ...rice, salt: null }, 100).salt).toBeNull();
});
test('a missing value makes a daily total unknown; explicit zeros stay zero', () => {
  expect(
    totals([
      { ...rice, salt: 0 },
      { ...rice, salt: 0 },
    ]).salt,
  ).toBe(0);
  expect(
    totals([
      { ...rice, salt: 1 },
      { ...rice, salt: null },
    ]).salt,
  ).toBeNull();
});
test.each([-1, NaN, Infinity, '1'])(
  'rejects invalid added nutrition %s',
  (salt) => {
    expect(validIngredient({ ...rice, salt } as never)).toBe(false);
  },
);
test('AI must return extra fields, including explicit nulls when unknown', () => {
  expect(() => validateAnalysis({ ...output, ingredients: [rice] })).toThrow();
  expect(validateAnalysis(output).ingredients[0].salt).toBeNull();
});
