import { AnalysisError, Nutrients, nutrientKeys } from './nutrition';
export type ProductNutrition = {
  basis: string;
  source: 'label' | 'estimate';
  values: { [Key in keyof Nutrients]: number | null };
};
export type ProductAnalysis = {
  name: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  allergens: string[];
  uncertainties: string[];
  advice: string;
  nutrition: ProductNutrition | null;
};
export const productListKeys = [
  'strengths',
  'concerns',
  'allergens',
  'uncertainties',
] as const;
export function validateProduct(value: unknown): ProductAnalysis {
  if (!value || typeof value !== 'object') throw new AnalysisError('invalid');
  const data = value as Record<string, unknown>;
  if (data.isFood === false) throw new AnalysisError('noFood');
  const isText = (value: unknown): value is string =>
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 4000;
  if (
    data.isFood !== true ||
    !isText(data.name) ||
    !isText(data.summary) ||
    !isText(data.advice) ||
    productListKeys.some(
      (key) =>
        !Array.isArray(data[key]) ||
        data[key].length > 10 ||
        !data[key].every(isText),
    )
  )
    throw new AnalysisError('invalid');
  let nutrition: ProductNutrition | null = null;
  if (data.nutrition !== null) {
    if (!data.nutrition || typeof data.nutrition !== 'object')
      throw new AnalysisError('invalid');
    const candidate = data.nutrition as Record<string, unknown>;
    if (
      !isText(candidate.basis) ||
      !['label', 'estimate'].includes(candidate.source as string) ||
      !candidate.values ||
      typeof candidate.values !== 'object'
    )
      throw new AnalysisError('invalid');
    const values = candidate.values as Record<string, unknown>;
    for (const key of nutrientKeys) {
      const value = values[key];
      if (
        value !== null &&
        (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
      )
        throw new AnalysisError('invalid');
    }
    if (nutrientKeys.every((key) => values[key] === null))
      throw new AnalysisError('invalid');
    nutrition = {
      basis: candidate.basis.trim(),
      source: candidate.source as ProductNutrition['source'],
      values: Object.fromEntries(
        nutrientKeys.map((key) => [key, values[key]]),
      ) as ProductNutrition['values'],
    };
  }
  return {
    name: (data.name as string).trim(),
    summary: data.summary as string,
    advice: data.advice as string,
    strengths: data.strengths as string[],
    concerns: data.concerns as string[],
    allergens: data.allergens as string[],
    uncertainties: data.uncertainties as string[],
    nutrition,
  };
}
