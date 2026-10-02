import { validateWaterChange } from '../core/water';
// Browser preview only. The API key lives in memory, never localStorage.
import { Meal, Settings } from '../core/nutrition';
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
  if (meal.photoUri && !meal.photoUri.startsWith('data:')) {
    const blob = await (await fetch(meal.photoUri)).blob();
    const photoUri = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    meal = { ...meal, photoUri };
  }
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
  key = '';
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
