import { validateWaterChange } from '../core/water';
// Browser preview only. The API key lives in memory, never localStorage.
import { Meal, Settings, mealPhotos } from '../core/nutrition';
import { Backup } from '../core/backup';
import { AiUsage } from '../core/aiUsage';
let key = '';
const MEALS = 'meal-diary-meals';
const SETTINGS = 'meal-diary-settings';
export async function listMeals(): Promise<Meal[]> {
  return JSON.parse(localStorage.getItem(MEALS) || '[]');
}
export async function readSettings(): Promise<Settings | null> {
  return JSON.parse(localStorage.getItem(SETTINGS) || 'null');
}
export async function writeSettings(settings: Settings) {
  localStorage.setItem(SETTINGS, JSON.stringify(settings));
}
export async function saveMeal(meal: Meal) {
  const uris: string[] = [];
  for (const uri of mealPhotos(meal)) {
    if (uri.startsWith('data:')) {
      uris.push(uri);
      continue;
    }
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Photo unavailable');
    const blob = await response.blob();
    uris.push(
      await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      }),
    );
  }
  meal = {
    ...meal,
    photoUri: uris[0],
    ...(meal.photoUris ? { photoUris: uris } : {}),
  };
  const meals = await listMeals();
  localStorage.setItem(
    MEALS,
    JSON.stringify([...meals.filter((item) => item.id !== meal.id), meal]),
  );
  return meal;
}
export async function deleteMeal(meal: Meal) {
  localStorage.setItem(
    MEALS,
    JSON.stringify((await listMeals()).filter((item) => item.id !== meal.id)),
  );
}
export async function readKey() {
  return key;
}
export async function writeKey(value: string) {
  key = value.trim();
}
export async function clearStorage() {
  localStorage.removeItem(MEALS);
  localStorage.removeItem(SETTINGS);
  localStorage.removeItem('meal-diary-water');
  localStorage.removeItem('meal-diary-ai-usage');
  key = '';
}

export async function readAiUsage(): Promise<AiUsage[]> {
  return JSON.parse(localStorage.getItem('meal-diary-ai-usage') || '[]');
}
export async function writeAiUsage(entry: AiUsage) {
  const history: AiUsage[] = JSON.parse(
    localStorage.getItem('meal-diary-ai-usage') || '[]',
  );
  localStorage.setItem(
    'meal-diary-ai-usage',
    JSON.stringify([...history.filter((item) => item.id !== entry.id), entry]),
  );
}

export async function readWater(): Promise<Record<string, number>> {
  return JSON.parse(localStorage.getItem('meal-diary-water') || '{}');
}
export async function adjustWater(day: string, delta: number): Promise<number> {
  validateWaterChange(day, delta);
  // No await between read and write, so rapid browser writes cannot race.
  const water: Record<string, number> = JSON.parse(
    localStorage.getItem('meal-diary-water') || '{}',
  );
  water[day] = Math.max(0, (water[day] ?? 0) + delta);
  localStorage.setItem('meal-diary-water', JSON.stringify(water));
  return water[day];
}

export async function replaceData(backup: Backup) {
  const entries = {
    [MEALS]: JSON.stringify(backup.meals),
    [SETTINGS]: JSON.stringify(backup.settings),
    'meal-diary-water': JSON.stringify(backup.water),
    'meal-diary-ai-usage': JSON.stringify(backup.aiUsage),
  };
  const previous = Object.fromEntries(
    Object.keys(entries).map((name) => [name, localStorage.getItem(name)]),
  );
  try {
    for (const [name, value] of Object.entries(entries))
      localStorage.setItem(name, value);
  } catch (error) {
    for (const name of Object.keys(entries)) localStorage.removeItem(name);
    for (const [name, value] of Object.entries(previous))
      if (value !== null) localStorage.setItem(name, value);
    throw error;
  }
}
