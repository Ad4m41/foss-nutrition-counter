import { Profile } from './profile';
import { ClarificationQuestion, validateQuestions } from './clarification';
export type Language = 'pl' | 'en';
export const requiredNutrientKeys = [
  'kcal',
  'protein',
  'fat',
  'carbs',
] as const;
export const additionalNutrientKeys = [
  'saturatedFat',
  'sugars',
  'fiber',
  'salt',
] as const;
export const nutrientKeys = [
  ...requiredNutrientKeys,
  ...additionalNutrientKeys,
] as const;
export type Nutrients = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
} & { [Key in (typeof additionalNutrientKeys)[number]]?: number | null };
export type Ingredient = Nutrients & {
  id: string;
  name: string;
  grams: number;
};
export type Meal = {
  id: string;
  name: string;
  day: string;
  createdAt: string;
  ingredients: Ingredient[];
  source: 'manual' | 'ai';
  notes: string;
  photoUri?: string;
};
export type Settings = {
  goal: number;
  language: Language;
  languageMode?: 'system' | 'manual';
  model: string;
  consent: boolean;
  skipKeySetup?: boolean;
  profile?: Profile;
  profileSetupDone?: boolean;
  waterGoal?: number;
  macroGoals?: Partial<Record<'protein' | 'carbs' | 'fat', number>>;
  aiDailyLimit?: number;
};
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export function totals(items: Nutrients[]): Nutrients {
  const sum: Nutrients = {
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    saturatedFat: 0,
    sugars: 0,
    fiber: 0,
    salt: 0,
  };
  for (const item of items) {
    for (const key of requiredNutrientKeys) sum[key] += item[key];
    for (const key of additionalNutrientKeys) {
      const value = item[key];
      const current = sum[key];
      sum[key] = value == null || current == null ? null : current + value;
    }
  }
  return sum;
}
export function resizePortion(item: Ingredient, grams: number): Ingredient {
  if (!Number.isFinite(grams) || grams <= 0) throw new Error('invalidPortion');
  const ratio = grams / item.grams;
  const scaled = { ...item, grams };
  for (const key of requiredNutrientKeys) scaled[key] = item[key] * ratio;
  for (const key of additionalNutrientKeys) {
    if (key in item)
      scaled[key] = item[key] == null ? null : item[key]! * ratio;
  }
  return scaled;
}
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDay(date) === day;
}
export function moveDay(day: string, offset: number): string {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + offset);
  return localDay(date);
}
export function parseNumber(text: string): number {
  if (!text.trim()) return NaN;
  return Number(text.trim().replace(',', '.'));
}
export function validIngredient(item: Ingredient): boolean {
  return (
    Boolean(item.name.trim()) &&
    Number.isFinite(item.grams) &&
    item.grams > 0 &&
    requiredNutrientKeys.every(
      (key) => Number.isFinite(item[key]) && item[key] >= 0,
    ) &&
    additionalNutrientKeys.every(
      (key) =>
        item[key] == null || (Number.isFinite(item[key]) && item[key]! >= 0),
    )
  );
}
export function newIngredient(id: string): Ingredient {
  return {
    id,
    name: '',
    grams: 100,
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    saturatedFat: null,
    sugars: null,
    fiber: null,
    salt: null,
  };
}
export class AnalysisError extends Error {
  constructor(
    public code:
      | 'key'
      | 'quota'
      | 'model'
      | 'network'
      | 'timeout'
      | 'invalid'
      | 'noFood'
      | 'server'
      | 'storage'
      | 'localLimit',
  ) {
    super(code);
  }
}
export type Analysis = {
  name: string;
  ingredients: Ingredient[];
  notes: string;
  questions?: ClarificationQuestion[];
};
export function validateAnalysis(value: unknown): Analysis {
  if (!value || typeof value !== 'object') throw new AnalysisError('invalid');
  const data = value as Record<string, unknown>;
  if (data.isFood === false) throw new AnalysisError('noFood');
  if (
    data.isFood !== true ||
    typeof data.name !== 'string' ||
    !data.name.trim() ||
    typeof data.notes !== 'string' ||
    !Array.isArray(data.ingredients) ||
    data.ingredients.length === 0 ||
    data.ingredients.length > 40
  )
    throw new AnalysisError('invalid');
  const ingredients = data.ingredients.map((entry: unknown, index: number) => {
    if (!entry || typeof entry !== 'object') throw new AnalysisError('invalid');
    const item = { ...(entry as Ingredient), id: `ai-${index}` };
    if (
      typeof item.name !== 'string' ||
      !validIngredient(item) ||
      additionalNutrientKeys.some((key) => !(key in item))
    )
      throw new AnalysisError('invalid');
    return item;
  });
  let questions: ClarificationQuestion[];
  try {
    questions = validateQuestions(data.questions);
  } catch {
    throw new AnalysisError('invalid');
  }
  return { name: data.name.trim(), ingredients, notes: data.notes, questions };
}
