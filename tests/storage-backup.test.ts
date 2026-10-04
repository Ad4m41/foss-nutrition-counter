import { validateBackup } from '../src/core/backup';
import * as storage from '../src/services/storage';

const mockSql = new (require('node:sqlite').DatabaseSync)(':memory:');
const mockFiles = new Map<string, string>();
let mockFailWater = false;
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async (sql: string) => mockSql.exec(sql),
    getFirstAsync: async (sql: string, ...params: unknown[]) =>
      mockSql.prepare(sql).get(...params),
    getAllAsync: async (sql: string, ...params: unknown[]) =>
      mockSql.prepare(sql).all(...params),
    runAsync: async (sql: string, ...params: unknown[]) => {
      if (mockFailWater && sql.startsWith('INSERT INTO water'))
        throw new Error('Disk full');
      return mockSql.prepare(sql).run(...params);
    },
    withExclusiveTransactionAsync: async (
      action: (tx: unknown) => Promise<void>,
    ) => {
      const tx = {
        execAsync: async (sql: string) => mockSql.exec(sql),
        runAsync: async (sql: string, ...params: unknown[]) => {
          if (mockFailWater && sql.startsWith('INSERT INTO water'))
            throw new Error('Disk full');
          return mockSql.prepare(sql).run(...params);
        },
      };
      mockSql.exec('BEGIN');
      try {
        await action(tx);
        mockSql.exec('COMMIT');
      } catch (error) {
        mockSql.exec('ROLLBACK');
        throw error;
      }
    },
  }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: async () => 'existing-api-key',
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'restored-photo' }));
jest.mock('expo-file-system', () => ({
  Directory: class {
    uri = 'file:///documents/meal-photos';
    create() {}
  },
  Paths: { document: 'file:///documents' },
  File: class {
    uri: string;
    constructor(base: { uri: string } | string, name?: string) {
      this.uri = typeof base === 'string' ? base : `${base.uri}/${name}`;
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    write(content: string) {
      mockFiles.set(this.uri, content);
    }
    delete() {
      mockFiles.delete(this.uri);
    }
  },
}));
const original = {
  id: 'old',
  name: 'Old meal',
  day: '2026-10-01',
  createdAt: '2026-10-01T12:00:00Z',
  source: 'manual' as const,
  notes: '',
  photoUri: 'file:///documents/meal-photos/old.jpg',
  ingredients: [
    {
      id: 'food',
      name: 'Food',
      grams: 100,
      kcal: 100,
      protein: 5,
      carbs: 10,
      fat: 4,
    },
  ],
};
const backup = () =>
  validateBackup({
    format: 'meal-diary',
    version: 1,
    createdAt: '2026-10-04T12:00:00Z',
    settings: { goal: 2200, language: 'en', model: 'gemini-3.5-flash-lite' },
    meals: [
      { ...original, id: 'new', photoUri: 'data:image/jpeg;base64,AA==' },
    ],
    water: { '2026-10-04': 250 },
    aiUsage: [],
  });

beforeEach(async () => {
  mockFailWater = false;
  await storage.listMeals();
  mockSql.exec(
    'DELETE FROM meals; DELETE FROM water; DELETE FROM settings; DELETE FROM ai_usage;',
  );
  mockFiles.clear();
  mockFiles.set(original.photoUri, 'original photo');
  await storage.saveMeal(original);
  await storage.writeSettings({
    goal: 1800,
    language: 'pl',
    model: 'gemini-3.5-flash-lite',
    consent: true,
  });
});
afterAll(() => mockSql.close());
test('restoration swaps all rows, retains the API key and cleans old photos after commit', async () => {
  await storage.replaceData(backup());
  expect((await storage.listMeals()).map((meal) => meal.id)).toEqual(['new']);
  expect(await storage.readWater()).toEqual({ '2026-10-04': 250 });
  expect((await storage.readSettings())?.goal).toBe(2200);
  expect(await storage.readKey()).toBe('existing-api-key');
  expect(mockFiles.has(original.photoUri)).toBe(false);
  expect(
    mockFiles.get('file:///documents/meal-photos/restored-photo.jpg'),
  ).toBe('AA==');
});
test('a mid-restore write failure rolls back SQLite and cleans only staged photos', async () => {
  mockFailWater = true;
  await expect(storage.replaceData(backup())).rejects.toThrow('Disk full');
  expect((await storage.listMeals()).map((meal) => meal.id)).toEqual(['old']);
  expect((await storage.readSettings())?.goal).toBe(1800);
  expect(mockFiles.has(original.photoUri)).toBe(true);
  expect(
    mockFiles.has('file:///documents/meal-photos/restored-photo.jpg'),
  ).toBe(false);
});
