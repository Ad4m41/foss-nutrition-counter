import {
  activityLevels,
  energyEstimate,
  nutritionEstimate,
  Profile,
  validProfile,
} from '../src/core/profile';
const base: Profile = {
  age: 30,
  height: 180,
  weight: 80,
  sex: 'male',
  activity: 1,
  objective: 'maintain',
};
test('adult resting expenditure uses Mifflin–St Jeor and selected PAL', () => {
  expect(energyEstimate(base)).toEqual({
    resting: 1780,
    maintenance: 2848,
    goal: 2848,
    pal: 1.6,
  });
  expect(energyEstimate({ ...base, sex: 'female' })?.resting).toBe(1614);
});
test('five activity bands increase the estimate', () => {
  const targets = activityLevels.map(
    (_, activity) => energyEstimate({ ...base, activity })!.goal,
  );
  expect(targets).toEqual([...targets].sort((a, b) => a - b));
  expect(activityLevels).toHaveLength(5);
});
test('goal adjustments use the unrounded estimate', () => {
  expect(energyEstimate({ ...base, objective: 'lose' })?.goal).toBe(2563);
  expect(energyEstimate({ ...base, objective: 'gain' })?.goal).toBe(3133);
});
test.each([
  { age: 17 },
  { age: NaN },
  { age: 30.5 },
  { weight: 0 },
  { weight: Infinity },
  { height: 0 },
  { activity: -1 },
  { activity: 5 },
  { activity: 1.5 },
  { sex: null },
  { objective: 'invalid' },
])('invalid profile %j never produces a target', (invalid) => {
  const p = { ...base, ...invalid } as Profile;
  expect(validProfile(p)).toBe(false);
  expect(energyEstimate(p)).toBeNull();
});

test('profile macros balance the calculated energy and respond to activity and goal', () => {
  const estimate = nutritionEstimate(base)!;
  const { protein, carbs, fat } = estimate.macroGoals;
  expect(
    Math.abs(protein * 4 + carbs * 4 + fat * 9 - estimate.goal),
  ).toBeLessThanOrEqual(2);
  expect(
    nutritionEstimate({ ...base, activity: 4 })!.macroGoals.protein,
  ).toBeGreaterThan(protein);
  expect(
    nutritionEstimate({ ...base, objective: 'lose' })!.macroGoals.protein,
  ).toBeGreaterThan(protein);
  for (const change of [
    { age: 19 },
    { height: 165 },
    { weight: 60 },
    { objective: 'gain' as const },
  ]) {
    expect(nutritionEstimate({ ...base, ...change })).not.toEqual(estimate);
  }
  expect(nutritionEstimate({ ...base, age: 17 })).toBeNull();
});
test.each([30, 80, 350])(
  'extreme valid weight %s still yields positive balanced macros',
  (weight) => {
    const estimate = nutritionEstimate({
      ...base,
      age: 100,
      height: 100,
      sex: 'female',
      weight,
      objective: 'lose',
    })!;
    const { protein, carbs, fat } = estimate.macroGoals;
    expect(Math.min(protein, carbs, fat)).toBeGreaterThan(0);
    expect(
      Math.abs(protein * 4 + carbs * 4 + fat * 9 - estimate.goal),
    ).toBeLessThanOrEqual(2);
  },
);
