import { useCallback, useMemo, useState } from 'react';
import { StreakHabit } from './types';

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const todayKey = () => formatDate(new Date());

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isConsecutive(previous: string, current: string) {
  const prev = parseDateKey(previous);
  const curr = parseDateKey(current);
  return prev.getTime() + 24 * 60 * 60 * 1000 === curr.getTime();
}

function getCurrentStreak(history: string[]): number {
  const sorted = Array.from(new Set(history)).sort();
  if (!sorted.length) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(sorted[sorted.length - 1]);
  const today = new Date(todayKey());

  const normalizedHistory = new Set(sorted);
  while (normalizedHistory.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getBestStreak(history: string[]): number {
  const sorted = Array.from(new Set(history)).sort();
  if (!sorted.length) {
    return 0;
  }

  let best = 0;
  let currentStreak = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    if (isConsecutive(sorted[i - 1], sorted[i])) {
      currentStreak += 1;
    } else {
      best = Math.max(best, currentStreak);
      currentStreak = 1;
    }
  }

  return Math.max(best, currentStreak);
}

function createHabit(name: string): StreakHabit {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    history: [],
    createdAt: new Date().toISOString(),
  };
}

export function useStreaks(initialHabits: StreakHabit[] = []) {
  const [habits, setHabits] = useState<StreakHabit[]>(initialHabits);

  const addHabit = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    setHabits((current) => [...current, createHabit(trimmed)]);
  }, []);

  const removeHabit = useCallback((id: string) => {
    setHabits((current) => current.filter((habit) => habit.id !== id));
  }, []);

  const toggleToday = useCallback((id: string) => {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }

        const today = todayKey();
        const hasToday = habit.history.includes(today);
        const nextHistory = hasToday
          ? habit.history.filter((value) => value !== today)
          : [...habit.history, today];

        return {
          ...habit,
          history: nextHistory,
        };
      }),
    );
  }, []);

  const summary = useMemo(() => {
    const total = habits.length;
    const doneToday = habits.filter((habit) => habit.history.includes(todayKey())).length;
    const bestStreak = habits.reduce((max, habit) => Math.max(max, getBestStreak(habit.history)), 0);

    return { total, doneToday, bestStreak };
  }, [habits]);

  const habitsWithStreaks = useMemo(
    () =>
      habits.map((habit) => ({
        ...habit,
        currentStreak: getCurrentStreak(habit.history),
        bestStreak: getBestStreak(habit.history),
        completedToday: habit.history.includes(todayKey()),
      })),
    [habits],
  );

  return {
    habits: habitsWithStreaks,
    addHabit,
    removeHabit,
    toggleToday,
    totalHabits: summary.total,
    completedToday: summary.doneToday,
    bestStreak: summary.bestStreak,
  };
}
