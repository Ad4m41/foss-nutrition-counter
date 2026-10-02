export const activityLevels = [1.4, 1.6, 1.8, 2, 2.2] as const;
export type Profile = {
  age: number;
  height: number;
  weight: number;
  sex: 'female' | 'male';
  activity: number;
  objective: 'lose' | 'maintain' | 'gain';
};
export function validProfile(p: Profile): boolean {
  return (
    Number.isInteger(p.age) &&
    p.age >= 18 &&
    p.age <= 100 &&
    Number.isFinite(p.height) &&
    p.height >= 100 &&
    p.height <= 250 &&
    Number.isFinite(p.weight) &&
    p.weight >= 30 &&
    p.weight <= 350 &&
    ['female', 'male'].includes(p.sex) &&
    Number.isInteger(p.activity) &&
    p.activity >= 0 &&
    p.activity < 5 &&
    ['lose', 'maintain', 'gain'].includes(p.objective)
  );
}
/** Mifflin–St Jeor estimate; PAL bands and ±10% are editable app defaults. */
export function energyEstimate(p: Profile) {
  if (!validProfile(p)) return null;
  const resting =
    10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : -161);
  const maintenance = resting * activityLevels[p.activity];
  const multiplier =
    p.objective === 'lose' ? 0.9 : p.objective === 'gain' ? 1.1 : 1;
  return {
    resting: Math.round(resting),
    maintenance: Math.round(maintenance),
    goal: Math.round(maintenance * multiplier),
    pal: activityLevels[p.activity],
  };
}
