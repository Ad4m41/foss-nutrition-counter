import { randomUUID } from 'expo-crypto';
import { validateBackup } from '../src/core/backup';
import * as storage from '../src/services/storage';

const mockSql = new (require('node:sqlite').DatabaseSync)(':memory:');
const mockFiles = new Map<string, string>();
let mockFailWater = false;
let mockFailMeal = false;
let mockCopyWait: Promise<void> | undefined;
let mockFailCopy = false;
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async (sql: string) => mockSql.exec(sql),
    getFirstAsync: async (sql: string, ...params: unknown[]) =>
      mockSql.prepare(sql).get(...params),
    getAllAsync: async (sql: string, ...params: unknown[]) =>
      mockSql.prepare(sql).all(...params),
    runAsync: async (sql: string, ...params: unknown[]) => {
      if (mockFailMeal && sql.startsWith('INSERT OR REPLACE INTO meals'))
        throw new Error('Disk full');
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
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'restored-photo'),
}));
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
    async copy(destination: { uri: string }) {
      await mockCopyWait;
      const data = mockFiles.get(this.uri);
      if (data === undefined) throw new Error('Source missing');
      mockFiles.set(destination.uri, data);
      if (mockFailCopy) throw new Error('Copy failed');
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
  jest.mocked(randomUUID).mockReset().mockReturnValue('restored-photo');
  mockFailWater = false;
  mockFailMeal = false;
  mockFailCopy = false;
  mockCopyWait = undefined;
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

test('meal persistence waits for the photo copy before publishing its permanent URI', async () => {
  const draft = 'file:///documents/meal-photo-drafts/camera.jpg';
  mockFiles.set(draft, 'camera photo');
  let finish!: () => void;
  mockCopyWait = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const saving = storage.saveMeal({
    ...original,
    id: 'camera',
    photoUri: draft,
  });
  await Promise.resolve();
  expect((await storage.listMeals()).map((meal) => meal.id)).toEqual(['old']);
  finish();
  const saved = await saving;
  mockFiles.delete(draft); // editor cleanup after navigation
  expect(saved.photoUri).toBe(
    'file:///documents/meal-photos/restored-photo.jpg',
  );
  expect(mockFiles.get(saved.photoUri!)).toBe('camera photo');
  expect(
    (await storage.listMeals()).find((meal) => meal.id === 'camera')?.photoUri,
  ).toBe(saved.photoUri);
});
test.each(['copy', 'database'])(
  'failed %s preserves the previous meal and its photo for retry',
  async (failure) => {
    const draft = 'file:///documents/meal-photo-drafts/replacement.jpg';
    mockFiles.set(draft, 'replacement photo');
    mockFailCopy = failure === 'copy';
    mockFailMeal = failure === 'database';
    await expect(
      storage.saveMeal({ ...original, photoUri: draft }),
    ).rejects.toThrow();
    expect((await storage.listMeals())[0].photoUri).toBe(original.photoUri);
    expect(mockFiles.get(original.photoUri)).toBe('original photo');
    expect(mockFiles.get(draft)).toBe('replacement photo');
    expect(
      mockFiles.has('file:///documents/meal-photos/restored-photo.jpg'),
    ).toBe(false);
  },
);

test('multiple photos survive storage and a backup restore together', async () => {
  jest.mocked(randomUUID).mockReturnValueOnce('one').mockReturnValueOnce('two');
  mockFiles.set('file:///draft-one.jpg', 'one');
  mockFiles.set('file:///draft-two.jpg', 'two');
  const saved = await storage.saveMeal({
    ...original,
    photoUri: 'file:///draft-one.jpg',
    photoUris: ['file:///draft-one.jpg', 'file:///draft-two.jpg'],
  });
  expect(saved.photoUris).toEqual([
    'file:///documents/meal-photos/one.jpg',
    'file:///documents/meal-photos/two.jpg',
  ]);
  const data = backup();
  data.meals[0].photoUri = 'data:image/jpeg;base64,AA==';
  data.meals[0].photoUris = [
    'data:image/jpeg;base64,AA==',
    'data:image/jpeg;base64,BB==',
  ];
  jest
    .mocked(randomUUID)
    .mockReturnValueOnce('restored-one')
    .mockReturnValueOnce('restored-two');
  await storage.replaceData(data);
  const restored = (await storage.listMeals())[0];
  expect(restored.photoUris).toHaveLength(2);
  expect(mockFiles.get(restored.photoUris![0])).toBe('AA==');
  expect(mockFiles.get(restored.photoUris![1])).toBe('BB==');
  expect(mockFiles.has(saved.photoUris![1])).toBe(false);
});
