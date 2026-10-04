import { parseBackup, validateBackup } from '../src/core/backup';
import { emptyTokens } from '../src/core/aiUsage';
const data = () => ({
  format: 'meal-diary',
  version: 1,
  createdAt: '2026-10-04T12:00:00Z',
  settings: {
    goal: 2200,
    language: 'pl',
    languageMode: 'manual',
    model: 'gemini-3.5-flash-lite',
    consent: true,
    apiKey: 'must-not-export',
    macroGoals: { protein: 100, carbs: 300, fat: 66 },
    profile: {
      age: 30,
      height: 180,
      weight: 80,
      sex: 'male',
      activity: 1,
      objective: 'maintain',
    },
  },
  meals: [
    {
      id: 'meal-1',
      name: 'Rice',
      day: '2026-10-04',
      createdAt: '2026-10-04T12:00:00Z',
      source: 'ai',
      notes: 'Estimated',
      photoUri: 'data:image/jpeg;base64,AA==',
      ingredients: [
        {
          id: 'rice',
          name: 'Rice',
          grams: 100,
          kcal: 130,
          protein: 2,
          carbs: 28,
          fat: 1,
          fiber: null,
        },
      ],
    },
  ],
  water: { '2026-10-04': 500 },
  aiUsage: [
    {
      id: 'request-1',
      day: '2026-10-04',
      createdAt: '2026-10-04T12:00:00Z',
      kind: 'meal',
      status: 'success',
      model: 'gemini-3.5-flash-lite',
      tokens: emptyTokens(),
    },
  ],
});
test('round trip keeps nutrition, embedded photos, goals and history while removing credentials', () => {
  const backup = parseBackup(JSON.stringify(data()));
  expect(backup.meals[0].photoUri).toBe(data().meals[0].photoUri);
  expect(backup.settings.macroGoals).toEqual(data().settings.macroGoals);
  expect(backup.water).toEqual(data().water);
  expect(backup.aiUsage[0].tokens.total).toBeNull();
  expect(backup.settings.consent).toBe(false);
  expect(JSON.stringify(backup)).not.toContain('must-not-export');
});
test.each([0, 2, '1'])(
  'unsupported format version %s cannot be restored',
  (version) => {
    expect(() => validateBackup({ ...data(), version })).toThrow();
  },
);
test('invalid dates, nutrients, duplicate IDs and private photo paths fail before writes', () => {
  const original = data();
  const invalid = [
    { ...original, water: { '2026-02-30': 250 } },
    { ...original, meals: [...original.meals, ...original.meals] },
    {
      ...original,
      meals: [{ ...original.meals[0], photoUri: 'file:///private/photo.jpg' }],
    },
    { ...original, meals: [{ ...original.meals[0], id: '../escape' }] },
    {
      ...original,
      meals: [
        {
          ...original.meals[0],
          ingredients: [{ ...original.meals[0].ingredients[0], kcal: -1 }],
        },
      ],
    },
    {
      ...original,
      settings: {
        ...original.settings,
        profile: { ...original.settings.profile, age: 12 },
      },
    },
  ];
  for (const backup of invalid) expect(() => validateBackup(backup)).toThrow();
});
test('malformed JSON is rejected', () => {
  expect(() => parseBackup('{')).toThrow();
});
