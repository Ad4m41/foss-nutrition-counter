import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { getLocales, useLocales } from 'expo-localization';
import { randomUUID } from 'expo-crypto';
import {
  AnalysisError,
  DEFAULT_MODEL,
  Meal,
  Settings,
} from '../core/nutrition';
import { AiUsage, TokenUsage, createAiTracker } from '../core/aiUsage';
import { nutritionEstimate } from '../core/profile';
import { AppRelease } from '../core/releases';
import { checkForUpdate } from '../services/releases';
import { Backup } from '../core/backup';
import { translations } from '../core/i18n';
import * as storage from '../services/storage';
const tracker = createAiTracker(storage);
const defaults = (): Settings => ({
  goal: 2000,
  model: DEFAULT_MODEL,
  language: getLocales()[0]?.languageCode === 'pl' ? 'pl' : 'en',
  consent: false,
  languageMode: 'system',
});
type Context = {
  meals: Meal[];
  water: Record<string, number>;
  adjustWater: (day: string, delta: number) => Promise<void>;
  settings: Settings;
  apiKey: string;
  ready: boolean;
  error: boolean;
  reload: () => Promise<void>;
  saveMeal: (meal: Meal) => Promise<void>;
  deleteMeal: (meal: Meal) => Promise<void>;
  updateSettings: (settings: Settings, key?: string) => Promise<void>;
  clear: () => Promise<void>;
  restoreBackup: (backup: Backup) => Promise<void>;
  appRelease: AppRelease | null;
  checkingUpdates: boolean;
  updatesChecked: boolean;
  updateError: boolean;
  checkUpdates: () => Promise<void>;
  aiUsage: AiUsage[];
  aiBusy: boolean;
  trackAi: <T>(
    kind: AiUsage['kind'],
    request: (report: (tokens: TokenUsage) => void) => Promise<T>,
  ) => Promise<T>;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const locales = useLocales();
  const deviceLanguage = locales[0]?.languageCode === 'pl' ? 'pl' : 'en';
  const [meals, setMeals] = useState<Meal[]>([]);
  const [water, setWater] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState(defaults);
  const [apiKey, setApiKey] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [aiUsage, setAiUsage] = useState<AiUsage[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const aiInFlight = useRef(0);
  const [appRelease, setAppRelease] = useState<AppRelease | null>(null);
  const [checkingUpdates, setCheckingUpdates] = useState(true);
  const [updatesChecked, setUpdatesChecked] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const updateLock = useRef(false);
  async function checkUpdates() {
    if (updateLock.current) return;
    updateLock.current = true;
    setCheckingUpdates(true);
    setUpdateError(false);
    try {
      setAppRelease(await checkForUpdate());
      setUpdatesChecked(true);
    } catch {
      setUpdateError(true);
    } finally {
      updateLock.current = false;
      setCheckingUpdates(false);
    }
  }
  useEffect(() => {
    if (!ready) return;
    let active = true;
    updateLock.current = true;
    void checkForUpdate()
      .then((release) => {
        if (active) {
          setAppRelease(release);
          setUpdatesChecked(true);
        }
      })
      .catch(() => {
        if (active) setUpdateError(true);
      })
      .finally(() => {
        if (active) {
          updateLock.current = false;
          setCheckingUpdates(false);
        }
      });
    return () => {
      active = false;
    };
  }, [ready]);

  const reload = useCallback(
    () =>
      Promise.all([
        storage.listMeals(),
        storage.readSettings(),
        storage.readKey(),
        storage.readWater(),
        storage.readAiUsage(),
      ])
        .then(async ([entries, prefs, key, drinks, usage]) => {
          setMeals(entries);
          setWater(drinks);
          setAiUsage(usage);
          let loaded = prefs ?? defaults();
          // Populate targets for profiles saved before automatic macros existed.
          if (loaded.profile && loaded.macroGoals === undefined) {
            const estimate = nutritionEstimate(loaded.profile);
            if (estimate) {
              loaded = {
                ...loaded,
                goal: estimate.goal,
                macroGoals: estimate.macroGoals,
              };
              await storage.writeSettings(loaded);
            }
          }
          setSettings(loaded);
          setApiKey(key ?? '');
          setReady(true);
          setError(false);
        })
        .catch(() => {
          setError(true);
        }),
    [],
  );
  useEffect(() => {
    void reload();
  }, [reload]);
  async function saveMeal(meal: Meal) {
    const saved = await storage.saveMeal(meal);
    setMeals((current) => [
      ...current.filter((item) => item.id !== saved.id),
      saved,
    ]);
  }
  async function deleteMeal(meal: Meal) {
    await storage.deleteMeal(meal);
    setMeals((current) => current.filter((item) => item.id !== meal.id));
  }
  async function updateSettings(prefs: Settings, key?: string) {
    // Persist settings first so a failure never clears the visible key draft.
    await storage.writeSettings(prefs);
    setSettings(prefs);
    if (key !== undefined) {
      await storage.writeKey(key);
      setApiKey(key.trim());
    }
  }
  async function adjustWater(day: string, delta: number) {
    const ml = await storage.adjustWater(day, delta);
    setWater((current) => ({ ...current, [day]: ml }));
  }
  async function clear() {
    if (aiInFlight.current) throw new Error('AI request in progress');
    try {
      await storage.clearStorage();
    } finally {
      await reload();
    }
  }
  async function restoreBackup(backup: Backup) {
    if (aiInFlight.current) throw new Error('AI request in progress');
    await storage.replaceData(backup);
    await reload();
  }
  async function trackAi<T>(
    kind: AiUsage['kind'],
    request: (report: (tokens: TokenUsage) => void) => Promise<T>,
  ): Promise<T> {
    if (!apiKey.trim()) throw new AnalysisError('key');
    if (!/^[a-zA-Z0-9._-]+$/.test(settings.model))
      throw new AnalysisError('model');
    aiInFlight.current += 1;
    setAiBusy(true);
    try {
      return await tracker({
        id: randomUUID(),
        kind,
        model: settings.model,
        limit: settings.aiDailyLimit,
        request,
        onChange: (entry) =>
          setAiUsage((current) => [
            ...current.filter((item) => item.id !== entry.id),
            { ...entry },
          ]),
      });
    } finally {
      aiInFlight.current -= 1;
      setAiBusy(aiInFlight.current > 0);
    }
  }
  return (
    <AppContext.Provider
      value={{
        meals,
        water,
        adjustWater,
        settings:
          settings.languageMode === 'manual'
            ? settings
            : { ...settings, language: deviceLanguage },
        apiKey,
        ready,
        error,
        reload,
        saveMeal,
        deleteMeal,
        updateSettings,
        clear,
        restoreBackup,
        appRelease,
        checkingUpdates,
        updatesChecked,
        updateError,
        checkUpdates,
        aiUsage,
        aiBusy,
        trackAi,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider missing');
  return { ...context, t: translations(context.settings.language) };
}
