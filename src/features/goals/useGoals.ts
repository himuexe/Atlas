import { useCallback, useEffect, useMemo, useState } from 'react';
import { Goal } from './types';

function createGoal(title: string, note?: string): Goal {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    note: note?.trim() || undefined,
    completed: false,
    createdAt: new Date().toISOString(),
  };
}

export function useGoals(initialGoals: Goal[] = []) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  useEffect(() => {
    const stored = window.localStorage.getItem('atlas-goals');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Goal[];
        setGoals(parsed);
      } catch {
        window.localStorage.removeItem('atlas-goals');
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('atlas-goals', JSON.stringify(goals));
  }, [goals]);

  const addGoal = useCallback((title: string, note?: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const nextGoal = createGoal(trimmedTitle, note);
    setGoals((current) => [nextGoal, ...current]);
  }, []);

  const toggleGoal = useCallback((id: string) => {
    setGoals((current) => current.map((goal) => (goal.id === id ? { ...goal, completed: !goal.completed } : goal)));
  }, []);

  const removeGoal = useCallback((id: string) => {
    setGoals((current) => current.filter((goal) => goal.id !== id));
  }, []);

  const completedCount = useMemo(() => goals.filter((goal) => goal.completed).length, [goals]);

  return {
    goals,
    addGoal,
    toggleGoal,
    removeGoal,
    completedCount,
  };
}
