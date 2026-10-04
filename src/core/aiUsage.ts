import { AnalysisError, localDay } from './nutrition';

export type TokenUsage = {
  input: number | null;
  output: number | null;
  thinking: number | null;
  cached: number | null;
  total: number | null;
};
export type AiUsage = {
  id: string;
  day: string;
  createdAt: string;
  model: string;
  kind: 'meal' | 'product';
  status: 'pending' | 'success' | 'error' | 'cancelled';
  errorCode?: string;
  tokens: TokenUsage;
};
export const emptyTokens = (): TokenUsage => ({
  input: null,
  output: null,
  thinking: null,
  cached: null,
  total: null,
});
export function parseTokenUsage(metadata: unknown): TokenUsage {
  const data =
    metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>)
      : {};
  const count = (key: string) =>
    typeof data[key] === 'number' &&
    Number.isSafeInteger(data[key]) &&
    (data[key] as number) >= 0
      ? (data[key] as number)
      : null;
  return {
    input: count('promptTokenCount'),
    output: count('candidatesTokenCount'),
    thinking: count('thoughtsTokenCount'),
    cached: count('cachedContentTokenCount'),
    total: count('totalTokenCount'),
  };
}
export function validRequestLimit(limit?: number) {
  return limit === undefined || (Number.isSafeInteger(limit) && limit > 0);
}
export function summarizeUsage(entries: AiUsage[]) {
  return {
    requests: entries.length,
    input: entries.reduce((sum, entry) => sum + (entry.tokens.input ?? 0), 0),
    output: entries.reduce((sum, entry) => sum + (entry.tokens.output ?? 0), 0),
    total: entries.reduce((sum, entry) => sum + (entry.tokens.total ?? 0), 0),
    unknown: entries.filter((entry) => entry.tokens.total === null).length,
  };
}

/** Serialize reservations, including disk writes, before any network request. */
export function createAiTracker(storage: {
  readAiUsage: () => Promise<AiUsage[]>;
  writeAiUsage: (entry: AiUsage) => Promise<void>;
}) {
  let reservation = Promise.resolve();
  async function readHistory() {
    try {
      return await storage.readAiUsage();
    } catch {
      throw new AnalysisError('storage');
    }
  }
  async function persist(entry: AiUsage) {
    try {
      await storage.writeAiUsage(entry);
    } catch {
      throw new AnalysisError('storage');
    }
  }
  return async function track<T>(options: {
    id: string;
    model: string;
    kind: AiUsage['kind'];
    limit?: number;
    onChange: (entry: AiUsage) => void;
    request: (report: (tokens: TokenUsage) => void) => Promise<T>;
  }): Promise<T> {
    const reserve = reservation.then(async () => {
      if (!validRequestLimit(options.limit))
        throw new AnalysisError('localLimit');
      const now = new Date();
      const day = localDay(now);
      const history = await readHistory();
      if (
        options.limit &&
        history.filter((entry) => entry.day === day).length >= options.limit
      )
        throw new AnalysisError('localLimit');
      const entry: AiUsage = {
        id: options.id,
        day,
        createdAt: now.toISOString(),
        model: options.model,
        kind: options.kind,
        status: 'pending',
        tokens: emptyTokens(),
      };
      await persist(entry);
      options.onChange(entry);
      return entry;
    });
    reservation = reserve.then(
      () => undefined,
      () => undefined,
    );
    const entry = await reserve;
    const report = (tokens: TokenUsage) => {
      entry.tokens = tokens;
    };
    let result: T;
    try {
      result = await options.request(report);
    } catch (error) {
      entry.status =
        error instanceof Error && error.name === 'AbortError'
          ? 'cancelled'
          : 'error';
      entry.errorCode = error instanceof AnalysisError ? error.code : undefined;
      await persist(entry);
      options.onChange(entry);
      throw error;
    }
    entry.status = 'success';
    await persist(entry);
    options.onChange(entry);
    return result;
  };
}
