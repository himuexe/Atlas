import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  deleteGoalFromDB,
  getGoalMilestonesFromDB,
  getGoalsFromDB,
  replaceGoalMilestonesInDB,
  replaceGoalsInDB,
  saveGoalInDB,
} from '../../lib/persistence/sqlite';
import { Goal, GoalMilestone, GoalWithMilestones } from './types';

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
  const [goals, setGoals] = useState<GoalWithMilestones[]>(initialGoals.map((goal) => ({ ...goal, milestones: [] })));

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const [persistedGoals, persistedMilestones] = await Promise.all([
          getGoalsFromDB(),
          getGoalMilestonesFromDB(),
        ]);
        const loadedGoals: Goal[] = persistedGoals.length > 0 ? persistedGoals : getLegacyGoals();
        const nextGoals = loadedGoals.map((goal) => ({
          ...goal,
          milestones: persistedMilestones
            .filter((milestone) => milestone.goalId === goal.id)
            .sort((a, b) => a.position - b.position),
        }));

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

  const persistGoal = useCallback(async (goal: Goal) => {
    try {
      await saveGoalInDB(goal);
    } catch (error) {
      console.error('Failed to persist goal', error);
    }
  }, []);

  const addGoal = useCallback((title: string, note?: string) => {
    if (!title.trim()) return;

    const nextGoal = createGoal(title, note);
    setGoals((current) => {
      const nextGoals = [{ ...nextGoal, milestones: [] }, ...current];
      void persistGoal(nextGoal);
      return nextGoals;
    });
  }, [persistGoal]);

  const toggleGoal = useCallback((id: string) => {
    setGoals((current) => {
      const nextGoals = current.map((goal) => (goal.id === id ? { ...goal, completed: !goal.completed } : goal));
      const updatedGoal = nextGoals.find((goal) => goal.id === id);
      if (updatedGoal) void persistGoal(updatedGoal);
      return nextGoals;
    });
  }, [persistGoal]);

  const removeGoal = useCallback((id: string) => {
    setGoals((current) => {
      const nextGoals = current.filter((goal) => goal.id !== id);
      void deleteGoalFromDB(id).catch((error) => console.error('Failed to delete goal', error));
      return nextGoals;
    });
  }, []);

  const addMilestone = useCallback((goalId: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setGoals((current) => {
      const nextGoals = current.map((goal) => {
        if (goal.id !== goalId || goal.milestones.length >= 5) return goal;
        const milestone: GoalMilestone = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          goalId,
          title: trimmedTitle,
          position: goal.milestones.length,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        const milestones = [...goal.milestones, milestone];
        void replaceGoalMilestonesInDB(goalId, milestones).catch((error) => console.error('Failed to add goal milestone', error));
        return { ...goal, milestones };
      });
      return nextGoals;
    });
  }, []);

  const updateMilestones = useCallback((goalId: string, update: (milestones: GoalMilestone[]) => GoalMilestone[]) => {
    setGoals((current) => current.map((goal) => {
      if (goal.id !== goalId) return goal;
      const milestones = update(goal.milestones).map((milestone, position) => ({ ...milestone, position }));
      void replaceGoalMilestonesInDB(goalId, milestones).catch((error) => console.error('Failed to update goal milestones', error));
      return { ...goal, milestones };
    }));
  }, []);

  const toggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    updateMilestones(goalId, (milestones) => milestones.map((milestone) => {
      if (milestone.id !== milestoneId) return milestone;
      const completed = !milestone.completed;
      return { ...milestone, completed, completedAt: completed ? new Date().toISOString() : undefined };
    }));
  }, [updateMilestones]);

  const removeMilestone = useCallback((goalId: string, milestoneId: string) => {
    updateMilestones(goalId, (milestones) => milestones.filter((milestone) => milestone.id !== milestoneId));
  }, [updateMilestones]);

  const moveMilestone = useCallback((goalId: string, milestoneId: string, direction: -1 | 1) => {
    updateMilestones(goalId, (milestones) => {
      const currentIndex = milestones.findIndex((milestone) => milestone.id === milestoneId);
      const nextIndex = currentIndex + direction;
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= milestones.length) return milestones;
      const reordered = [...milestones];
      [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
      return reordered;
    });
  }, [updateMilestones]);

  const reset = useCallback(() => {
    setGoals([]);
    void replaceGoalsInDB([]).catch((error) => console.error('Failed to reset goals', error));
  }, []);

  const completedCount = useMemo(() => goals.filter((goal) => goal.completed).length, [goals]);

  return {
    goals,
    addGoal,
    toggleGoal,
    removeGoal,
    addMilestone,
    toggleMilestone,
    removeMilestone,
    moveMilestone,
    reset,
    completedCount,
  };
}
