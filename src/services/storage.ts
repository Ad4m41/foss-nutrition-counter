import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { Directory, File, Paths } from 'expo-file-system';
import { Meal, Settings } from '../core/nutrition';

let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  database ??= (async () => {
    const connection = await SQLite.openDatabaseAsync('meals.db');
    await connection.execAsync(`PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS meals (id TEXT PRIMARY KEY NOT NULL, day TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS meals_day ON meals(day);
      CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL);
      PRAGMA user_version = 1;`);
    return connection;
  })();
  try {
    return await database;
  } catch (error) {
    database = undefined;
    throw error;
  }
}
function photoDirectory() {
  return new Directory(Paths.document, 'meal-photos');
}
export async function listMeals(): Promise<Meal[]> {
  const rows = await (
    await db()
  ).getAllAsync<{ payload: string }>(
    'SELECT payload FROM meals ORDER BY day DESC',
  );
  return rows.map((row) => JSON.parse(row.payload));
}
export async function readSettings(): Promise<Settings | null> {
  const row = await (
    await db()
  ).getFirstAsync<{ payload: string }>(
    'SELECT payload FROM settings WHERE id = 1',
  );
  return row ? JSON.parse(row.payload) : null;
}
export async function writeSettings(settings: Settings) {
  await (
    await db()
  ).runAsync(
    'INSERT OR REPLACE INTO settings (id, payload) VALUES (1, ?)',
    JSON.stringify(settings),
  );
}
export async function saveMeal(meal: Meal): Promise<Meal> {
  let saved = meal;
  let copied: File | undefined;
  if (
    meal.photoUri &&
    !meal.photoUri.startsWith(photoDirectory().uri.replace(/\/$/, '') + '/')
  ) {
    const directory = photoDirectory();
    directory.create({ idempotent: true, intermediates: true });
    copied = new File(directory, `${meal.id}.jpg`);
    new File(meal.photoUri).copy(copied);
    saved = { ...meal, photoUri: copied.uri };
  }
  try {
    await (
      await db()
    ).runAsync(
      'INSERT OR REPLACE INTO meals (id, day, payload) VALUES (?, ?, ?)',
      saved.id,
      saved.day,
      JSON.stringify(saved),
    );
  } catch (error) {
    if (copied?.exists) copied.delete();
    throw error;
  }
  return saved;
}
export async function deleteMeal(meal: Meal) {
  // Remove the private file first. A failure keeps the row available for retry.
  if (meal.photoUri) {
    const file = new File(meal.photoUri);
    if (file.exists) file.delete();
  }
  await (await db()).runAsync('DELETE FROM meals WHERE id = ?', meal.id);
}
const KEY = 'gemini-api-key';
export const readKey = () => SecureStore.getItemAsync(KEY);
export const writeKey = (key: string) =>
  key.trim()
    ? SecureStore.setItemAsync(KEY, key.trim(), {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      })
    : SecureStore.deleteItemAsync(KEY);
export async function clearStorage() {
  await writeKey('');
  const directory = photoDirectory();
  if (directory.exists) directory.delete();
  await (
    await db()
  ).withTransactionAsync(async () => {
    await (await db()).runAsync('DELETE FROM meals');
    await (await db()).runAsync('DELETE FROM settings');
  });
}
