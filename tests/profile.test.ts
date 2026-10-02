import {
  activityLevels,
  energyEstimate,
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
