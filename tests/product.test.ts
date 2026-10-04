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
