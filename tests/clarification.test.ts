import {
  hasQuestionAnswers,
  QuestionAnswers,
  serializeClarification,
  validateQuestions,
} from '../src/core/clarification';
const yesNo = {
  id: 'oil',
  prompt: 'Was oil added?',
  reason: 'Oil changes the energy estimate.',
  priority: 'recommended',
  type: 'yesNo',
};
const slider = {
  id: 'portion',
  prompt: 'How large was the portion?',
  reason: 'Portion size changes nutrition.',
  priority: 'recommended',
  type: 'slider',
  min: 0,
  max: 500,
  step: 5,
  unit: 'g',
};
const text = {
  id: 'food',
  prompt: 'Which grain is this?',
  reason: 'The grain is unclear.',
  priority: 'optional',
  type: 'text',
};
test('supports no questions and orders recommended ones first', () => {
  expect(validateQuestions(undefined)).toEqual([]);
  expect(validateQuestions([])).toEqual([]);
  expect(validateQuestions([text, yesNo, slider]).map((q) => q.id)).toEqual([
    'oil',
    'portion',
    'food',
  ]);
});
test.each([
  null,
  'question',
  [null],
  [yesNo, yesNo],
  [yesNo, slider, text, { ...text, id: 'fourth' }],
  [{ ...yesNo, type: 'checkbox' }],
  [{ ...yesNo, prompt: '' }],
  [{ ...yesNo, priority: 'required' }],
  [{ ...slider, min: -1 }],
  [{ ...slider, max: 10001 }],
  [{ ...slider, step: 0 }],
  [{ ...slider, max: 0 }],
  [{ ...slider, step: Infinity }],
  [{ ...slider, unit: '' }],
])('rejects malformed controls before rendering', (value) =>
  expect(() => validateQuestions(value)).toThrow('invalidQuestions'),
);
test('false and zero are answers; an untouched or empty field is not', () => {
  expect(hasQuestionAnswers({})).toBe(false);
  expect(hasQuestionAnswers({ food: '  ' })).toBe(false);
  expect(hasQuestionAnswers({ oil: false })).toBe(true);
  expect(hasQuestionAnswers({ portion: 0 })).toBe(true);
  expect(hasQuestionAnswers({ portion: NaN })).toBe(false);
});
test('skipped questions remain unknown, distinct from no or zero', () => {
  expect(
    serializeClarification({
      questions: validateQuestions([yesNo, slider, text]),
      answers: { oil: false, portion: 0, food: ' ' },
    }),
  ).toEqual([
    { question: yesNo.prompt, type: 'yesNo', answer: false },
    { question: slider.prompt, type: 'slider', unit: 'g', answer: 0 },
    { question: text.prompt, type: 'text', answer: null },
  ]);
});
test.each<QuestionAnswers>([
  { oil: 'no' },
  { portion: 501 },
  { portion: -1 },
  { portion: Infinity },
  { food: 'x'.repeat(1001) },
])('rejects answers of the wrong type or range', (answers) => {
  expect(() =>
    serializeClarification({
      questions: validateQuestions([yesNo, slider, text]),
      answers,
    }),
  ).toThrow('invalidAnswer');
});
