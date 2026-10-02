import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getLocales } from 'expo-localization';
import { DEFAULT_MODEL, Meal, Settings } from '../core/nutrition';
import { translations } from '../core/i18n';
import * as storage from '../services/storage';
const defaults = (): Settings => ({
  goal: 2000,
  model: DEFAULT_MODEL,
  language: getLocales()[0]?.languageCode === 'pl' ? 'pl' : 'en',
  consent: false,
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
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [water, setWater] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState(defaults);
  const [apiKey, setApiKey] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const reload = useCallback(
    () =>
      Promise.all([
        storage.listMeals(),
        storage.readSettings(),
        storage.readKey(),
        storage.readWater(),
      ])
        .then(([entries, prefs, key, drinks]) => {
          setMeals(entries);
          setWater(drinks);
          setSettings(prefs ?? defaults());
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
    try {
      await storage.clearStorage();
    } finally {
      await reload();
    }
  }
  return (
    <AppContext.Provider
      value={{
        meals,
        water,
        adjustWater,
        settings,
        apiKey,
        ready,
        error,
        reload,
        saveMeal,
        deleteMeal,
        updateSettings,
        clear,
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
