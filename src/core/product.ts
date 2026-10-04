import { AnalysisError } from './nutrition';
export type ProductAnalysis = {
  name: string;
  summary: string;
  strengths: string[];
  concerns: string[];
  allergens: string[];
  uncertainties: string[];
  advice: string;
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
  return {
    name: (data.name as string).trim(),
    summary: data.summary as string,
    advice: data.advice as string,
    strengths: data.strengths as string[],
    concerns: data.concerns as string[],
    allergens: data.allergens as string[],
    uncertainties: data.uncertainties as string[],
  };
}
