import {
  AiUsage,
  createAiTracker,
  emptyTokens,
  parseTokenUsage,
  summarizeUsage,
  validRequestLimit,
} from '../src/core/aiUsage';
import { AnalysisError } from '../src/core/nutrition';

function setup() {
  const history = new Map<string, AiUsage>();
  const storage = {
    readAiUsage: jest.fn(async () => [...history.values()]),
    writeAiUsage: jest.fn(async (entry: AiUsage) => {
      history.set(entry.id, JSON.parse(JSON.stringify(entry)));
    }),
  };
  return { storage, history, track: createAiTracker(storage) };
}
const options = {
  id: '1',
  model: 'gemini-test',
  kind: 'meal' as const,
  onChange: jest.fn(),
};
afterEach(() => jest.useRealTimers());
test('a simultaneous meal and product cannot exceed the shared limit', async () => {
  const { track, history } = setup();
  let finish: (value: string) => void = () => {};
  const request = jest.fn(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const first = track({ ...options, limit: 1, request });
  const blockedRequest = jest.fn(async () => 'blocked');
  await expect(
    track({
      ...options,
      id: '2',
      kind: 'product',
      limit: 1,
      request: blockedRequest,
    }),
  ).rejects.toMatchObject({ code: 'localLimit' });
  expect(blockedRequest).not.toHaveBeenCalled();
  expect(history.get('1')?.status).toBe('pending');
  finish('done');
  expect(await first).toBe('done');
  expect(history.get('1')?.status).toBe('success');
});
test('an error still consumes a slot, retains reported tokens and survives reopening', async () => {
  const { track, storage, history } = setup();
  await expect(
    track({
      ...options,
      limit: 1,
      request: async (report) => {
        report({ ...emptyTokens(), input: 100, output: 20, total: 120 });
        throw new AnalysisError('invalid');
      },
    }),
  ).rejects.toMatchObject({ code: 'invalid' });
  expect(history.get('1')).toMatchObject({
    status: 'error',
    tokens: { total: 120 },
  });
  const reopened = createAiTracker(storage);
  const request = jest.fn();
  await expect(
    reopened({ ...options, id: '2', limit: 1, request }),
  ).rejects.toMatchObject({ code: 'localLimit' });
  expect(request).not.toHaveBeenCalled();
});
test('resets the request limit at local midnight', async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 4, 23, 59));
  const { track } = setup();
  const request = jest.fn(async () => 'done');
  await track({ ...options, limit: 1, request });
  jest.setSystemTime(new Date(2026, 9, 5, 0, 1));
  await expect(track({ ...options, id: '2', limit: 1, request })).resolves.toBe(
    'done',
  );
  expect(request).toHaveBeenCalledTimes(2);
});
test('failed reservation storage prevents sending and does not poison future reservations', async () => {
  const { storage, track } = setup();
  storage.writeAiUsage.mockRejectedValueOnce(new Error('disk full'));
  const request = jest.fn(async () => 'done');
  await expect(track({ ...options, request })).rejects.toMatchObject({
    code: 'storage',
  });
  expect(request).not.toHaveBeenCalled();
  await expect(track({ ...options, id: '2', request })).resolves.toBe('done');
});
test('cancellation remains counted with unknown tokens', async () => {
  const { track, history } = setup();
  const error = new Error('cancelled');
  error.name = 'AbortError';
  await expect(
    track({
      ...options,
      request: async () => {
        throw error;
      },
    }),
  ).rejects.toThrow('cancelled');
  expect(history.get('1')).toMatchObject({
    status: 'cancelled',
    tokens: { total: null },
  });
});
test('does not derive totals or replace unavailable metadata with zero', () => {
  expect(
    parseTokenUsage({
      promptTokenCount: 100,
      candidatesTokenCount: 20,
      thoughtsTokenCount: 10,
      cachedContentTokenCount: 0,
      totalTokenCount: 130,
    }),
  ).toEqual({ input: 100, output: 20, thinking: 10, cached: 0, total: 130 });
  expect(
    parseTokenUsage({
      promptTokenCount: -1,
      candidatesTokenCount: '20',
      totalTokenCount: Infinity,
    }),
  ).toEqual(emptyTokens());
  expect(parseTokenUsage(undefined)).toEqual(emptyTokens());
});
test('summary distinguishes reported totals from unknown requests', () => {
  const entry: AiUsage = {
    ...options,
    day: '2026-10-04',
    createdAt: '',
    status: 'error',
    tokens: emptyTokens(),
  };
  expect(
    summarizeUsage([
      entry,
      {
        ...entry,
        id: '2',
        tokens: { ...emptyTokens(), input: 3, output: 1, total: 6 },
      },
    ]),
  ).toEqual({ requests: 2, input: 3, output: 1, total: 6, unknown: 1 });
});
test.each([0, -1, 1.5, NaN, Infinity])(
  'rejects invalid local limit %s',
  (value) => expect(validRequestLimit(value)).toBe(false),
);
