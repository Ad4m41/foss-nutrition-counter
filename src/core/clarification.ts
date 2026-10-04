type QuestionBase = {
  id: string;
  prompt: string;
  reason: string;
  priority: 'recommended' | 'optional';
};
export type ClarificationQuestion = QuestionBase &
  (
    | { type: 'yesNo' | 'text' }
    | { type: 'slider'; min: number; max: number; step: number; unit: string }
  );
export type QuestionAnswers = Record<string, boolean | number | string>;
export type MealClarification = {
  questions: ClarificationQuestion[];
  answers: QuestionAnswers;
};

/** Accept older results without questions, but never render unvalidated AI controls. */
export function validateQuestions(value: unknown): ClarificationQuestion[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 3)
    throw new Error('invalidQuestions');
  const ids = new Set<string>();
  const text = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
  const questions = value.map((value: unknown): ClarificationQuestion => {
    if (!value || typeof value !== 'object')
      throw new Error('invalidQuestions');
    const q = value as Record<string, unknown>;
    if (
      typeof q.id !== 'string' ||
      !/^[a-zA-Z0-9_-]{1,64}$/.test(q.id) ||
      ids.has(q.id) ||
      ['__proto__', 'constructor', 'prototype'].includes(q.id) ||
      !text(q.prompt) ||
      !text(q.reason) ||
      (q.priority !== 'recommended' && q.priority !== 'optional')
    )
      throw new Error('invalidQuestions');
    ids.add(q.id);
    const base: QuestionBase = {
      id: q.id,
      prompt: q.prompt.trim(),
      reason: q.reason.trim(),
      priority: q.priority,
    };
    if (q.type === 'yesNo' || q.type === 'text')
      return { ...base, type: q.type };
    if (
      q.type !== 'slider' ||
      typeof q.min !== 'number' ||
      typeof q.max !== 'number' ||
      typeof q.step !== 'number' ||
      !Number.isFinite(q.min) ||
      !Number.isFinite(q.max) ||
      !Number.isFinite(q.step) ||
      q.min < 0 ||
      q.max > 10000 ||
      q.max <= q.min ||
      q.step < 0.01 ||
      q.step > q.max - q.min ||
      typeof q.unit !== 'string' ||
      !q.unit.trim() ||
      q.unit.length > 20
    )
      throw new Error('invalidQuestions');
    return {
      ...base,
      type: 'slider',
      min: q.min,
      max: q.max,
      step: q.step,
      unit: q.unit.trim(),
    };
  });
  return questions.sort(
    (a, b) =>
      Number(b.priority === 'recommended') -
      Number(a.priority === 'recommended'),
  );
}
export function hasQuestionAnswers(answers: QuestionAnswers) {
  return Object.values(answers).some((value) =>
    typeof value === 'string'
      ? !!value.trim()
      : typeof value === 'boolean' || Number.isFinite(value),
  );
}
export function serializeClarification({
  questions,
  answers,
}: MealClarification) {
  const checked = validateQuestions(questions);
  return checked.map((question) => {
    const value = answers[question.id];
    const answer = typeof value === 'string' ? value.trim() : value;
    if (answer !== undefined && answer !== '') {
      if (
        (question.type === 'yesNo' && typeof answer !== 'boolean') ||
        (question.type === 'text' &&
          (typeof answer !== 'string' || answer.length > 1000)) ||
        (question.type === 'slider' &&
          (typeof answer !== 'number' ||
            !Number.isFinite(answer) ||
            answer < question.min ||
            answer > question.max))
      )
        throw new Error('invalidAnswer');
    }
    return {
      question: question.prompt,
      type: question.type,
      unit: question.type === 'slider' ? question.unit : undefined,
      answer: answer === undefined || answer === '' ? null : answer,
    };
  });
}
