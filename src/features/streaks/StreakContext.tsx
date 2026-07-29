import { createContext, ReactNode, useContext } from 'react';
import { useStreaks } from './useStreaks';
import { StreakHabit } from './types';

interface StreakContextValue {
  habits: Array<StreakHabit & { currentStreak: number; bestStreak: number; completedToday: boolean }>;
  addHabit: (name: string) => void;
  removeHabit: (id: string) => void;
  toggleToday: (id: string) => void;
  reset: () => void;
  totalHabits: number;
  completedToday: number;
  bestStreak: number;
}

const StreakContext = createContext<StreakContextValue | null>(null);

interface StreakProviderProps {
  children: ReactNode;
}

export function StreakProvider({ children }: StreakProviderProps) {
  const streaks = useStreaks();

  return <StreakContext.Provider value={streaks}>{children}</StreakContext.Provider>;
}

export function useStreaksContext() {
  const context = useContext(StreakContext);
  if (!context) {
    throw new Error('useStreaksContext must be used within a StreakProvider');
  }
  return context;
}
