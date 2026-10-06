import {
  analyzePhoto,
  analyzeProduct,
  checkApiKey,
} from '../src/services/gemini';
import { AbortController as NativeAbortController } from 'abort-controller';
import { validateQuestions } from '../src/core/clarification';
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
      quantity: 1,
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
test('can analyze with the AbortSignal used by React Native, which has no throwIfAborted', async () => {
  const controller = new NativeAbortController();
  expect('throwIfAborted' in controller.signal).toBe(false);
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
    }),
  });
  await expect(
    analyzePhoto({ ...options, signal: controller.signal as AbortSignal }),
  ).resolves.toMatchObject({ name: 'Rice' });
});
test('reports Google usage even when generated nutrition is unusable', async () => {
  const onUsage = jest.fn();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [],
      usageMetadata: {
        promptTokenCount: 10,
        totalTokenCount: 13,
        thoughtsTokenCount: 3,
      },
    }),
  });
  await expect(analyzePhoto({ ...options, onUsage })).rejects.toMatchObject({
    code: 'invalid',
  });
  expect(onUsage).toHaveBeenCalledWith({
    input: 10,
    output: null,
    thinking: 3,
    cached: null,
    total: 13,
  });
});
test('checks a text-only product using structured output without an image', async () => {
  const product = {
    isFood: true,
    name: 'Yogurt',
    summary: 'General information',
    strengths: [],
    concerns: [],
    allergens: [],
    uncertainties: ['No label supplied'],
    advice: 'Read the label',
  };
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: 'ignore' },
              { text: JSON.stringify(product) },
            ],
          },
        },
      ],
    }),
  });
  expect(
    await analyzeProduct({
      ...options,
      base64: undefined,
      description: 'Yogurt',
    }),
  ).toMatchObject({ name: 'Yogurt' });
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.contents[0].parts).toEqual([{ text: 'Yogurt' }]);
  expect(body.generationConfig.responseJsonSchema.required).toContain(
    'uncertainties',
  );
});
test('never sends a pre-cancelled request', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    analyzePhoto({ ...options, signal: controller.signal }),
  ).rejects.toBeDefined();
  expect(fetchMock).not.toHaveBeenCalled();
});
test('checks a product with a native signal and reports its tokens', async () => {
  const controller = new NativeAbortController();
  const onUsage = jest.fn();
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  isFood: true,
                  name: 'Yogurt',
                  summary: 'Summary',
                  strengths: [],
                  concerns: [],
                  allergens: [],
                  uncertainties: [],
                  advice: 'Read the label',
                }),
              },
            ],
          },
        },
      ],
      usageMetadata: { totalTokenCount: 12 },
    }),
  });
  await expect(
    analyzeProduct({
      ...options,
      signal: controller.signal as AbortSignal,
      onUsage,
    }),
  ).resolves.toMatchObject({ name: 'Yogurt' });
  expect(onUsage).toHaveBeenCalledWith(expect.objectContaining({ total: 12 }));
});
test('a cancelled native signal never sends a request', async () => {
  const controller = new NativeAbortController();
  controller.abort();
  await expect(
    analyzePhoto({ ...options, signal: controller.signal as AbortSignal }),
  ).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetchMock).not.toHaveBeenCalled();
});
test('initial estimates may include questions only when useful', async () => {
  const question = {
    id: 'oil',
    type: 'yesNo',
    prompt: 'Was oil added?',
    reason: 'Hidden oil changes energy.',
    priority: 'recommended',
    min: null,
    max: null,
    step: null,
    unit: '',
  };
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              { text: JSON.stringify({ ...output, questions: [question] }) },
            ],
          },
        },
      ],
    }),
  });
  expect((await analyzePhoto(options)).questions).toMatchObject([
    { id: 'oil', type: 'yesNo', priority: 'recommended' },
  ]);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(
    body.generationConfig.responseJsonSchema.properties.questions.maxItems,
  ).toBe(3);
});
test('follow-up sends original context and answers, keeps skips unknown, and cannot start a question loop', async () => {
  const questions = validateQuestions([
    {
      id: 'oil',
      type: 'yesNo',
      prompt: 'Was oil added?',
      reason: 'Energy',
      priority: 'recommended',
    },
    {
      id: 'portion',
      type: 'slider',
      prompt: 'Portion?',
      reason: 'Weight',
      priority: 'optional',
      min: 0,
      max: 500,
      step: 5,
      unit: 'g',
    },
  ]);
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify({ ...output, questions }) }],
          },
        },
      ],
    }),
  });
  const result = await analyzePhoto({
    ...options,
    description: 'Rice',
    clarification: { questions, answers: { oil: false } },
  });
  expect(result.questions).toEqual([]);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  const parts = body.contents[0].parts;
  expect(parts[0].inlineData.data).toBe(options.base64);
  expect(parts[1].text).toBe('Rice');
  expect(parts[2].text).toContain('"answer":false');
  expect(parts[2].text).toContain('"answer":null');
  expect(body.systemInstruction.parts[0].text).toContain(
    'do NOT ask further questions',
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test('can estimate a description without a photo', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(output) }] } }],
    }),
  });
  await expect(
    analyzePhoto({ ...options, base64: undefined, description: '200 g rice' }),
  ).resolves.toMatchObject({ name: 'Rice' });
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).contents[0].parts).toEqual(
    [{ text: '200 g rice' }],
  );
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

test.each([
  ['5 kajzerek', 'Roll', 5, 60, 170, 300, 850],
  [
    '2 duże pizze tureckie. Zdjęcie pokazuje 1/3 jednej pizzy.',
    'Turkish pizza',
    2,
    450,
    1000,
    900,
    2000,
  ],
  ['Zjadłem 1/3 pizzy', 'Pizza', 1 / 3, 450, 900, 150, 300],
])(
  'scales the full described meal exactly once: %s',
  async (
    description,
    name,
    quantity,
    grams,
    kcal,
    expectedGrams,
    expectedKcal,
  ) => {
    const result = {
      ...output,
      ingredients: [{ ...output.ingredients[0], name, quantity, grams, kcal }],
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(result) }] } },
        ],
      }),
    });
    const estimate = await analyzePhoto({ ...options, description });
    expect(estimate.ingredients[0].grams).toBeCloseTo(expectedGrams);
    expect(estimate.ingredients[0].kcal).toBeCloseTo(expectedKcal);
    expect(estimate.ingredients[0].protein).toBeCloseTo(5 * quantity);
    expect(estimate.ingredients[0].salt).toBeNull();
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.contents[0].parts).toContainEqual({ text: description });
  },
);

test('mixed foods scale independently rather than multiplying the entire meal', async () => {
  const result = {
    ...output,
    ingredients: [
      {
        ...output.ingredients[0],
        name: 'Roll',
        quantity: 5,
        grams: 60,
        kcal: 170,
      },
      {
        ...output.ingredients[0],
        name: 'Egg',
        quantity: 1,
        grams: 55,
        kcal: 80,
      },
    ],
  };
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify(result) }] } }],
    }),
  });
  const estimate = await analyzePhoto({
    ...options,
    description: '5 rolls and 1 egg',
  });
  expect(estimate.ingredients.map((i) => i.kcal)).toEqual([850, 80]);
});

test.each([undefined, 0, -1, '5', 1001])(
  'rejects an unusable portion quantity: %s',
  async (quantity) => {
    const result = {
      ...output,
      ingredients: [{ ...output.ingredients[0], quantity }],
    };
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: JSON.stringify(result) }] } },
        ],
      }),
    });
    await expect(analyzePhoto(options)).rejects.toMatchObject({
      code: 'invalid',
    });
  },
);
