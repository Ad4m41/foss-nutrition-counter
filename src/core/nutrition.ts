export type Language = 'pl' | 'en';
export type Nutrients = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};
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
  model: string;
  consent: boolean;
};
export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const nutrientKeys = ['kcal', 'protein', 'fat', 'carbs'] as const;
export function totals(items: Nutrients[]): Nutrients {
  return items.reduce(
    (sum, item) => {
      for (const key of nutrientKeys) sum[key] += item[key];
      return sum;
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 },
  );
}
export function resizePortion(item: Ingredient, grams: number): Ingredient {
  if (!Number.isFinite(grams) || grams <= 0) throw new Error('invalidPortion');
  const ratio = grams / item.grams;
  return {
    ...item,
    grams,
    kcal: item.kcal * ratio,
    protein: item.protein * ratio,
    fat: item.fat * ratio,
    carbs: item.carbs * ratio,
  };
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
    nutrientKeys.every((key) => Number.isFinite(item[key]) && item[key] >= 0)
  );
}
export function newIngredient(id: string): Ingredient {
  return { id, name: '', grams: 100, kcal: 0, protein: 0, fat: 0, carbs: 0 };
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
      | 'server',
  ) {
    super(code);
  }
}
export type Analysis = {
  name: string;
  ingredients: Ingredient[];
  notes: string;
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
    if (typeof item.name !== 'string' || !validIngredient(item))
      throw new AnalysisError('invalid');
    return item;
  });
  return { name: data.name.trim(), ingredients, notes: data.notes };
}
