import { useCallback, useEffect, useMemo, useState } from 'react';
import { getGoalsFromDB, replaceGoalsInDB } from '../../lib/persistence/sqlite';
import { Goal } from './types';

const LEGACY_STORAGE_KEY = 'atlas-goals';

function createGoal(title: string, note?: string): Goal {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    note: note?.trim() || undefined,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

function getLegacyGoals(): Goal[] {
  try {
    const stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Goal[]) : [];
  } catch {
    return [];
  }
}

export function useGoals(initialGoals: Goal[] = []) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const persistedGoals = await getGoalsFromDB();
        const nextGoals = persistedGoals.length > 0 ? persistedGoals : getLegacyGoals();

        if (persistedGoals.length === 0 && nextGoals.length > 0) {
          await replaceGoalsInDB(nextGoals);
        }
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);

        if (mounted) {
          setGoals(nextGoals);
        }
      } catch (error) {
        console.error('Failed to load goals from DB', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const syncGoals = useCallback(async (nextGoals: Goal[]) => {
    try {
      await replaceGoalsInDB(nextGoals);
    } catch (error) {
      console.error('Failed to persist goals', error);
    }
  }, []);

  const addGoal = useCallback((title: string, note?: string) => {
    if (!title.trim()) return;

    const nextGoal = createGoal(title, note);
    setGoals((current) => {
      const nextGoals = [nextGoal, ...current];
      void syncGoals(nextGoals);
      return nextGoals;
    });
  }, [syncGoals]);

  const toggleGoal = useCallback((id: string) => {
    setGoals((current) => {
      const nextGoals = current.map((goal) => (goal.id === id ? { ...goal, completed: !goal.completed } : goal));
      void syncGoals(nextGoals);
      return nextGoals;
    });
  }, [syncGoals]);

  const removeGoal = useCallback((id: string) => {
    setGoals((current) => {
      const nextGoals = current.filter((goal) => goal.id !== id);
      void syncGoals(nextGoals);
      return nextGoals;
    });
  }, [syncGoals]);

  const reset = useCallback(() => {
    setGoals([]);
    void syncGoals([]);
  }, [syncGoals]);

  const completedCount = useMemo(() => goals.filter((goal) => goal.completed).length, [goals]);

  return { goals, addGoal, toggleGoal, removeGoal, reset, completedCount };
}
