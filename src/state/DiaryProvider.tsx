import React, { createContext, useContext, useState } from 'react';
import { localDay } from '../core/nutrition';
const Context = createContext<{
  day: string;
  setDay: (day: string) => void;
} | null>(null);
export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [day, setDay] = useState(localDay);
  return (
    <Context.Provider value={{ day, setDay }}>{children}</Context.Provider>
  );
}
export function useDiaryDay() {
  const context = useContext(Context);
  if (!context) throw new Error('DiaryProvider missing');
  return context;
}
