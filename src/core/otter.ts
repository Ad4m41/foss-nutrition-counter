export interface OtterState {
  bodyScale: number;
  hydration: number;
}
// A playful reflection of logged entries, never an estimate of body weight.
export function otterState(
  kcal: number,
  energyGoal: number,
  water: number,
  waterGoal: number,
): OtterState {
  const progress = (value: number, goal: number, max: number) =>
    Number.isFinite(value) && Number.isFinite(goal) && goal > 0
      ? Math.max(0, Math.min(max, value / goal))
      : 0;
  return {
    bodyScale: 0.92 + progress(kcal, energyGoal, 1.5) * 0.12,
    hydration: 0.15 + progress(water, waterGoal, 1) * 0.85,
  };
}
