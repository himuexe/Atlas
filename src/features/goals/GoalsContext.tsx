import { createContext, ReactNode, useContext } from 'react';
import { useGoals } from './useGoals';
import { GoalWithMilestones } from './types';

interface GoalsContextValue {
  goals: GoalWithMilestones[];
  addGoal: (title: string, note?: string) => void;
  toggleGoal: (id: string) => void;
  removeGoal: (id: string) => void;
  addMilestone: (goalId: string, title: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  removeMilestone: (goalId: string, milestoneId: string) => void;
  moveMilestone: (goalId: string, milestoneId: string, direction: -1 | 1) => void;
  reset: () => void;
  completedCount: number;
}

const GoalsContext = createContext<GoalsContextValue | null>(null);

interface GoalsProviderProps {
  children: ReactNode;
}

export function GoalsProvider({ children }: GoalsProviderProps) {
  const goals = useGoals();
  return <GoalsContext.Provider value={goals}>{children}</GoalsContext.Provider>;
}

export function useGoalsContext() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoalsContext must be used within a GoalsProvider');
  }
  return context;
}
