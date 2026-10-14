import { useCallback, useEffect, useMemo, useState } from 'react';
import { StreakHabit } from './types';
import { getStreakHabitsFromDB, replaceStreakHabitsInDB } from '../../lib/persistence/sqlite';
import { calculateBestStreak, calculateCurrentStreak, getLocalDateKey, isRestDay } from './utils';

const todayKey = () => getLocalDateKey(new Date());

function createHabit(name: string, restDays: number[]): StreakHabit {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    history: [],
    restDays,
    createdAt: new Date().toISOString(),
  };
}

export function useStreaks(initialHabits: StreakHabit[] = []) {
  const [habits, setHabits] = useState<StreakHabit[]>(initialHabits);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const persistedHabits = await getStreakHabitsFromDB();
        if (mounted && persistedHabits.length > 0) {
          setHabits(persistedHabits);
        }
      } catch (err) {
        console.error('Failed to load streak habits from DB', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const syncHabits = useCallback(async (nextHabits: StreakHabit[]) => {
    try {
      await replaceStreakHabitsInDB(nextHabits);
    } catch (err) {
      console.error('Failed to persist streak habits', err);
    }
  }, []);

  const addHabit = useCallback((name: string, restDays: number[]) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    setHabits((current) => {
      const nextHabits = [...current, createHabit(trimmed, restDays)];
      void syncHabits(nextHabits);
      return nextHabits;
    });
  }, [syncHabits]);

  const updateRestDays = useCallback((id: string, restDays: number[]) => {
    const normalizedRestDays = Array.from(new Set(restDays))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
    setHabits((current) => {
      const nextHabits = current.map((habit) => habit.id === id ? { ...habit, restDays: normalizedRestDays } : habit);
      void syncHabits(nextHabits);
      return nextHabits;
    });
  }, [syncHabits]);

  const removeHabit = useCallback((id: string) => {
    setHabits((current) => {
      const nextHabits = current.filter((habit) => habit.id !== id);
      void syncHabits(nextHabits);
      return nextHabits;
    });
  }, [syncHabits]);

  const toggleToday = useCallback((id: string) => {
    setHabits((current) => {
      const nextHabits = current.map((habit) => {
        if (habit.id !== id) {
          return habit;
        }

        const today = todayKey();
        if (isRestDay(today, habit.restDays)) return habit;
        const hasToday = habit.history.includes(today);
        const nextHistory = hasToday
          ? habit.history.filter((value) => value !== today)
          : [...habit.history, today];

        return {
          ...habit,
          history: nextHistory,
        };
      });
      void syncHabits(nextHabits);
      return nextHabits;
    });
  }, [syncHabits]);

  const reset = useCallback(() => {
    setHabits([]);
    void syncHabits([]);
  }, [syncHabits]);

  const summary = useMemo(() => {
    const today = todayKey();
    const total = habits.length;
    const scheduledToday = habits.filter((habit) => !isRestDay(today, habit.restDays));
    const doneToday = scheduledToday.filter((habit) => habit.history.includes(today)).length;
    const bestStreak = habits.reduce((max, habit) => Math.max(max, calculateBestStreak(habit.history, habit.restDays)), 0);

    return { total, doneToday, scheduledToday: scheduledToday.length, bestStreak };
  }, [habits]);

  const habitsWithStreaks = useMemo(
    () =>
      habits.map((habit) => ({
        ...habit,
        currentStreak: calculateCurrentStreak(habit.history, habit.restDays),
        bestStreak: calculateBestStreak(habit.history, habit.restDays),
        completedToday: habit.history.includes(todayKey()),
        todayIsRestDay: isRestDay(todayKey(), habit.restDays),
      })),
    [habits],
  );

  return {
    habits: habitsWithStreaks,
    addHabit,
    updateRestDays,
    removeHabit,
    toggleToday,
    reset,
    totalHabits: summary.total,
    completedToday: summary.doneToday,
    scheduledToday: summary.scheduledToday,
    bestStreak: summary.bestStreak,
  };
}
