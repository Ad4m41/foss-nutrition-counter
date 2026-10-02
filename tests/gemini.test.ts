import { analyzePhoto, checkApiKey } from '../src/services/gemini';
const options = {
  key: 'test-key',
  model: 'gemini-3.5-flash-lite',
  base64: 'test-image',
  description: '',
  language: 'en' as const,
};
const output = {
  isFood: true,
  name: 'Rice',
  notes: '',
  ingredients: [
    {
      name: 'Rice',
      grams: 200,
      kcal: 260,
      protein: 5,
      fat: 1,
      carbs: 56,
      saturatedFat: 0.2,
      sugars: 0.1,
      fiber: 1,
      salt: null,
    },
  ],
};
const fetchMock = jest.fn();
beforeEach(() => {
  globalThis.fetch = fetchMock;
  fetchMock.mockReset();
});
test('sends the key in a header and asks for structured portion nutrition', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
    }),
  });
  expect((await analyzePhoto(options)).name).toBe('Rice');
  const [url, init] = fetchMock.mock.calls[0];
  const schema = JSON.parse(init.body).generationConfig.responseJsonSchema;
  expect(schema.properties.ingredients.items.required).toEqual(
    expect.arrayContaining(['salt', 'fiber', 'sugars', 'saturatedFat']),
  );
  expect(url).not.toContain(options.key);
  expect(init.headers['x-goog-api-key']).toBe(options.key);
  expect(JSON.parse(init.body).contents[0].parts[0].inlineData.mimeType).toBe(
    'image/jpeg',
  );
});
test.each([
  [403, 'key'],
  [429, 'quota'],
  [404, 'model'],
  [503, 'server'],
])('maps HTTP %s to a recoverable error', async (status, code) => {
  fetchMock.mockResolvedValue({ ok: false, status });
  await expect(analyzePhoto(options)).rejects.toMatchObject({ code });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('rejects blocked or malformed output', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ candidates: [] }),
  });
  await expect(analyzePhoto(options)).rejects.toMatchObject({
    code: 'invalid',
  });
});
test('network failures do not retry automatically', async () => {
  fetchMock.mockRejectedValue(new TypeError('Network failed'));
  await expect(analyzePhoto(options)).rejects.toMatchObject({
    code: 'network',
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('does not send requests without a key', async () => {
  await expect(analyzePhoto({ ...options, key: '' })).rejects.toMatchObject({
    code: 'key',
  });
  expect(fetchMock).not.toHaveBeenCalled();
});
test('timeout aborts the request', async () => {
  jest.useFakeTimers();
  fetchMock.mockImplementation(
    (_url, init) =>
      new Promise((_resolve, reject) =>
        init.signal.addEventListener('abort', () =>
          reject(new Error('aborted')),
        ),
      ),
  );
  const request = analyzePhoto(options);
  const assertion = expect(request).rejects.toMatchObject({ code: 'timeout' });
  jest.advanceTimersByTime(45000);
  await assertion;
  jest.useRealTimers();
});

describe('key authentication', () => {
  test.each([
    [200, 'valid'],
    [429, 'limited'],
    [401, 'invalid'],
    [403, 'invalid'],
    [500, 'unavailable'],
    [404, 'unavailable'],
  ])('HTTP %s returns %s without inference', async (status, expected) => {
    fetchMock.mockResolvedValue({ ok: status === 200, status });
    expect(await checkApiKey(' test-key ')).toBe(expected);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/models?pageSize=1');
    expect(url).not.toContain('test-key');
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    expect(init.body).toBeUndefined();
  });
  test.each(['API_KEY_INVALID', 'API_KEY_EXPIRED'])(
    'rejects explicit %s',
    async (reason) => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { details: [{ reason }] } }),
      });
      expect(await checkApiKey('key')).toBe('invalid');
    },
  );
  test('does not confuse generic bad requests with invalid keys', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Bad request' } }),
    });
    expect(await checkApiKey('key')).toBe('unavailable');
  });
  test('network errors preserve uncertainty', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    expect(await checkApiKey('key')).toBe('unavailable');
  });
  test('empty keys never make a request', async () => {
    expect(await checkApiKey(' ')).toBe('invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
