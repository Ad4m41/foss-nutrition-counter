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
  key = '';
}
