import { validateProduct } from '../src/core/product';
const product = {
  isFood: true,
  name: 'Yogurt',
  summary: 'Check the label.',
  strengths: ['Protein'],
  concerns: [],
  allergens: ['Milk is listed'],
  uncertainties: ['Portion unknown'],
  advice: 'Consider portion size.',
  nutrition: null,
};
test('validates a product explanation without turning it into a meal', () => {
  expect(validateProduct(product)).toMatchObject({
    name: 'Yogurt',
    allergens: ['Milk is listed'],
  });
  expect(validateProduct(product)).not.toHaveProperty('ingredients');
});
test.each([
  null,
  { ...product, isFood: 'true' },
  { ...product, summary: '' },
  { ...product, allergens: 'milk' },
  { ...product, uncertainties: [5] },
  { ...product, concerns: Array(11).fill('Concern') },
])('rejects malformed explanations', (value) =>
  expect(() => validateProduct(value)).toThrow('invalid'),
);
test('rejects a nonfood result', () =>
  expect(() => validateProduct({ isFood: false })).toThrow('noFood'));

const nutrition = {
  basis: 'Per 100 g',
  source: 'label',
  values: {
    kcal: 60,
    protein: 4,
    carbs: 5,
    fat: 3,
    saturatedFat: null,
    sugars: null,
    fiber: null,
    salt: 0.1,
  },
};
test('preserves readable label nutrition and unknown nutrients', () => {
  expect(validateProduct({ ...product, nutrition }).nutrition).toEqual(
    nutrition,
  );
});
test.each([
  undefined,
  { ...nutrition, basis: '' },
  { ...nutrition, source: 'database' },
  { ...nutrition, values: { ...nutrition.values, kcal: -1 } },
  { ...nutrition, values: { ...nutrition.values, fat: NaN } },
  { ...nutrition, values: { ...nutrition.values, salt: undefined } },
])(
  'rejects malformed nutrition without displaying invented zeros',
  (nutrition) => {
    expect(() => validateProduct({ ...product, nutrition })).toThrow('invalid');
  },
);
