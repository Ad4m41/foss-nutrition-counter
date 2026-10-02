import { analyzePhoto } from '../src/services/gemini';
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
    { name: 'Rice', grams: 200, kcal: 260, protein: 5, fat: 1, carbs: 56 },
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
