import { AiUsage, validRequestLimit } from './aiUsage';
import {
  Meal,
  Settings,
  nutrientKeys,
  requiredNutrientKeys,
  validDay,
} from './nutrition';
import { validProfile } from './profile';
export const MAX_BACKUP_BYTES = 32 * 1024 * 1024;
export type Backup = {
  format: 'meal-diary';
  version: 1;
  createdAt: string;
  meals: Meal[];
  settings: Settings;
  water: Record<string, number>;
  aiUsage: AiUsage[];
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid backup');
  return value as Record<string, unknown>;
}
function text(value: unknown, limit = 20000): value is string {
  return typeof value === 'string' && value.length <= limit;
}
function positive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}
function timestamp(value: unknown): value is string {
  return text(value, 40) && Number.isFinite(Date.parse(value));
}
function id(value: unknown): value is string {
  return typeof value === 'string' && /^[\w-]{1,128}$/.test(value);
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 5000)
    throw new Error('Invalid backup');
  return value;
}
/** Whitelist fields so a backup can never carry API credentials or private paths. */
export function validateBackup(value: unknown): Backup {
  const data = object(value);
  if (
    data.format !== 'meal-diary' ||
    data.version !== 1 ||
    !timestamp(data.createdAt)
  )
    throw new Error('Unsupported backup');
  const prefs = object(data.settings);
  if (
    !positive(prefs.goal) ||
    !['pl', 'en'].includes(String(prefs.language)) ||
    !text(prefs.model, 100) ||
    !/^[\w.-]+$/.test(prefs.model)
  )
    throw new Error('Invalid settings');
  if (
    prefs.profile !== undefined &&
    !validProfile(prefs.profile as Settings['profile'] & {})
  )
    throw new Error('Invalid profile');
  if (
    prefs.waterGoal !== undefined &&
    (!positive(prefs.waterGoal) ||
      prefs.waterGoal < 100 ||
      prefs.waterGoal > 20000)
  )
    throw new Error('Invalid water goal');
  if (!validRequestLimit(prefs.aiDailyLimit as number | undefined))
    throw new Error('Invalid AI limit');
  if (
    prefs.languageMode !== undefined &&
    !['system', 'manual'].includes(String(prefs.languageMode))
  )
    throw new Error('Invalid language mode');
  const macroGoals: Settings['macroGoals'] = {};
  if (prefs.macroGoals !== undefined)
    for (const key of ['protein', 'carbs', 'fat'] as const) {
      const n = object(prefs.macroGoals)[key];
      if (n !== undefined) {
        if (!positive(n)) throw new Error('Invalid macros');
        macroGoals[key] = n;
      }
    }
  const sourceProfile =
    prefs.profile === undefined ? undefined : object(prefs.profile);
  const profile = sourceProfile
    ? (Object.fromEntries(
        ['age', 'height', 'weight', 'sex', 'activity', 'objective'].map(
          (key) => [key, sourceProfile[key]],
        ),
      ) as Settings['profile'])
    : undefined;
  const settings: Settings = {
    goal: prefs.goal,
    language: prefs.language as Settings['language'],
    model: prefs.model,
    consent: false,
    skipKeySetup: true,
    ...(prefs.profile === undefined ? {} : { profile }),
    ...(typeof prefs.profileSetupDone === 'boolean'
      ? { profileSetupDone: prefs.profileSetupDone }
      : {}),
    ...(prefs.macroGoals === undefined ? {} : { macroGoals }),
    ...(prefs.waterGoal === undefined
      ? {}
      : { waterGoal: prefs.waterGoal as number }),
    ...(prefs.aiDailyLimit === undefined
      ? {}
      : { aiDailyLimit: prefs.aiDailyLimit as number }),
    ...(prefs.languageMode === undefined
      ? {}
      : { languageMode: prefs.languageMode as Settings['languageMode'] }),
  };
  const seen = new Set<string>();
  const meals = array(data.meals).map((raw): Meal => {
    const meal = object(raw);
    if (
      !id(meal.id) ||
      seen.has(meal.id) ||
      !text(meal.name, 500) ||
      !meal.name.trim() ||
      typeof meal.day !== 'string' ||
      !validDay(meal.day) ||
      !timestamp(meal.createdAt) ||
      !['ai', 'manual'].includes(String(meal.source)) ||
      !text(meal.notes)
    )
      throw new Error('Invalid meal');
    seen.add(meal.id);
    const ingredients = array(meal.ingredients).map((raw) => {
      const ingredient = object(raw);
      if (
        !id(ingredient.id) ||
        !text(ingredient.name, 500) ||
        !ingredient.name.trim() ||
        !positive(ingredient.grams)
      )
        throw new Error('Invalid ingredient');
      const nutrients: Record<string, number | null> = {};
      for (const key of nutrientKeys) {
        const n = ingredient[key];
        if (
          n == null &&
          !requiredNutrientKeys.some((required) => required === key)
        )
          nutrients[key] = null;
        else if (typeof n === 'number' && Number.isFinite(n) && n >= 0)
          nutrients[key] = n;
        else throw new Error('Invalid nutrients');
      }
      return {
        id: ingredient.id,
        name: ingredient.name,
        grams: ingredient.grams,
        ...nutrients,
      } as Meal['ingredients'][number];
    });
    if (!ingredients.length) throw new Error('Empty meal');
    if (
      meal.photoUri !== undefined &&
      (typeof meal.photoUri !== 'string' ||
        !/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/.test(
          meal.photoUri,
        ))
    )
      throw new Error('Invalid photo');
    return {
      id: meal.id,
      name: meal.name,
      day: meal.day,
      createdAt: meal.createdAt,
      notes: meal.notes,
      source: meal.source as Meal['source'],
      ingredients,
      ...(meal.photoUri ? { photoUri: meal.photoUri as string } : {}),
    };
  });
  const water: Record<string, number> = {};
  for (const [day, ml] of Object.entries(object(data.water))) {
    if (
      !validDay(day) ||
      typeof ml !== 'number' ||
      !Number.isSafeInteger(ml) ||
      ml < 0
    )
      throw new Error('Invalid water');
    water[day] = ml;
  }
  const usageIds = new Set<string>();
  const aiUsage = array(data.aiUsage).map((raw): AiUsage => {
    const entry = object(raw);
    if (
      !id(entry.id) ||
      usageIds.has(entry.id) ||
      typeof entry.day !== 'string' ||
      !validDay(entry.day) ||
      !timestamp(entry.createdAt) ||
      !text(entry.model, 100) ||
      !['meal', 'product'].includes(String(entry.kind)) ||
      !['pending', 'success', 'error', 'cancelled'].includes(
        String(entry.status),
      )
    )
      throw new Error('Invalid usage');
    usageIds.add(entry.id);
    const rawTokens = object(entry.tokens);
    const tokens = Object.fromEntries(
      ['input', 'output', 'thinking', 'cached', 'total'].map((key) => {
        const n = rawTokens[key];
        if (
          n !== null &&
          (typeof n !== 'number' || !Number.isSafeInteger(n) || n < 0)
        )
          throw new Error('Invalid tokens');
        return [key, n];
      }),
    ) as AiUsage['tokens'];
    return {
      id: entry.id,
      day: entry.day,
      createdAt: entry.createdAt,
      model: entry.model,
      kind: entry.kind as AiUsage['kind'],
      status: entry.status as AiUsage['status'],
      tokens,
      ...(text(entry.errorCode, 100) ? { errorCode: entry.errorCode } : {}),
    };
  });
  return {
    format: 'meal-diary',
    version: 1,
    createdAt: data.createdAt,
    settings,
    meals,
    water,
    aiUsage,
  };
}
export function parseBackup(json: string): Backup {
  if (json.length > MAX_BACKUP_BYTES) throw new Error('Backup too large');
  return validateBackup(JSON.parse(json));
}
