import { parseNumber, type Settings } from './nutrition';
export const macroKeys = ['protein', 'carbs', 'fat'] as const;
export function parseMacroGoals(
  draft: Record<(typeof macroKeys)[number], string>,
): Settings['macroGoals'] | null {
  const goals: NonNullable<Settings['macroGoals']> = {};
  for (const key of macroKeys) {
    if (!draft[key].trim()) continue;
    const value = parseNumber(draft[key]);
    if (!Number.isFinite(value) || value <= 0) return null;
    goals[key] = value;
  }
  return goals;
}
