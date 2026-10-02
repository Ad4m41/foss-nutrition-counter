import {
  adjustWater,
  readWater,
  clearStorage,
} from '../src/services/storage.web';
const data = new Map<string, string>();
beforeEach(() => {
  data.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => data.set(key, value),
      removeItem: (key: string) => data.delete(key),
    },
  });
});
test('water additions persist, remain separate by day and can be undone', async () => {
  await adjustWater('2026-10-02', 250);
  await adjustWater('2026-10-02', 500);
  await adjustWater('2026-10-01', 250);
  expect(await readWater()).toEqual({ '2026-10-02': 750, '2026-10-01': 250 });
  expect(await adjustWater('2026-10-02', -500)).toBe(250);
  expect(await adjustWater('2026-10-02', -500)).toBe(0);
});
test('concurrent quick additions are not lost', async () => {
  await Promise.all([
    adjustWater('2026-10-02', 250),
    adjustWater('2026-10-02', 250),
  ]);
  expect((await readWater())['2026-10-02']).toBe(500);
});
test.each([
  ['2026-99-99', 250],
  ['2026-10-02', NaN],
  ['2026-10-02', 250.5],
] as const)('rejects malformed water entries', async (day, delta) => {
  await expect(adjustWater(day, delta)).rejects.toThrow();
  expect(await readWater()).toEqual({});
});
test('reset removes hydration data', async () => {
  await adjustWater('2026-10-02', 250);
  await clearStorage();
  expect(await readWater()).toEqual({});
});
