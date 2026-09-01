import { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react';
import { CheckIn, XPEvent, PersonalLevel, Milestone } from './types';
import {
  getCheckInFromDB,
  getAllCheckInsFromDB,
  addCheckInToDB,
  removeCheckInFromDB,
  getXPEventsFromDB,
  addXPEventToDB,
  getMilestonesFromDB,
  unlockMilestoneInDB,
  initializeMilestonesInDB,
} from '../../lib/persistence/sqlite';
import { useStreaksContext } from '../streaks/StreakContext';
import { useFocus } from '../focus/FocusContext';

interface GamificationContextType {
  checkIn: CheckIn | null;
  allCheckIns: CheckIn[];
  xpEvents: XPEvent[];
  level: PersonalLevel;
  milestones: Milestone[];
  unlockedMilestones: Milestone[];
  currentCheckInStreak: number;
  addCheckIn: (data: Omit<CheckIn, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  removeCheckIn: (date: string) => Promise<void>;
  getTodayCheckIn: () => CheckIn | null;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [xpEvents, setXPEvents] = useState<XPEvent[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const { habits } = useStreaksContext();
  const { items } = useFocus();

  // Initialize data on mount
  useEffect(() => {
    const initData = async () => {
      try {
        await initializeMilestonesInDB();
        const [checkIns, xpEvents, milestones] = await Promise.all([
          getAllCheckInsFromDB(),
          getXPEventsFromDB(),
          getMilestonesFromDB(),
        ]);
        setCheckIns(checkIns);
        setXPEvents(xpEvents);
        setMilestones(milestones);
      } catch (err) {
        console.error('Failed to load gamification data', err);
      }
    };

    initData();
  }, []);

  // Calculate all streaks
  const calculateAllStreaks = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);

    // Check-in streak
    let checkInStreak = 0;
    const sortedCheckIns = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
    
    if (sortedCheckIns.length > 0) {
      const lastCheckInDate = new Date(sortedCheckIns[0].date);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate.getTime() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));

      // If last check-in is today or yesterday, count the streak
      if (daysDiff === 0 || daysDiff === 1) {
        for (let i = 0; i < sortedCheckIns.length; i++) {
          const currentDate = new Date(sortedCheckIns[i].date);
          const expectedDate = new Date(todayDate);
          expectedDate.setDate(expectedDate.getDate() - i);

          const currentDateStr = currentDate.toISOString().slice(0, 10);
          const expectedDateStr = expectedDate.toISOString().slice(0, 10);

          if (currentDateStr === expectedDateStr) {
            checkInStreak++;
          } else {
            break;
          }
        }
      }
    }

    // Habit streaks
    const habitStreaks = habits.map((habit) => habit.currentStreak);
    const totalHabitStreak = habitStreaks.reduce((a, b) => a + b, 0);

    // Focus completion streak
    let focusCompletionStreak = 0;
    const completedFocusItems = items.filter((item) => item.completed);
    if (completedFocusItems.length > 0) {
      // Simple count of completed items (in real app, track by date)
      focusCompletionStreak = Math.min(completedFocusItems.length, 20); // Cap at 20 for fairness
    }

    return { checkInStreak, totalHabitStreak, focusCompletionStreak };
  }, [checkIns, habits, items]);

  // Calculate XP from streaks
  const calculateTotalXP = useCallback(() => {
    const totalXP = xpEvents.reduce((sum, event) => sum + event.amount, 0);
    return totalXP;
  }, [xpEvents]);

  // Calculate level from XP
  const calculateLevel = useCallback(() => {
    const totalXP = calculateTotalXP();
    // Level progression: Level N requires 50 * N^2 XP
    // Level 1: 50 XP, Level 2: 200 XP, Level 3: 450 XP, Level 4: 800 XP, etc.
    
    let level = 1;
    let xpRequired = 50;
    let cumulativeXP = 0;

    while (cumulativeXP + xpRequired <= totalXP) {
      cumulativeXP += xpRequired;
      level++;
      xpRequired = 50 * level * level;
    }

    const xpForCurrentLevel = cumulativeXP;
    const xpForNextLevel = cumulativeXP + xpRequired;
    const xpProgress = totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progressPercentage = Math.floor((xpProgress / xpNeeded) * 100);

    return {
      level,
      totalXP,
      xpForNextLevel: xpNeeded - xpProgress,
      progressPercentage: Math.min(progressPercentage, 100),
    };
  }, [calculateTotalXP]);

  const addCheckIn = useCallback(
    async (data: Omit<CheckIn, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newCheckIn: CheckIn = {
        id: `checkin-${Date.now()}`,
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await addCheckInToDB(newCheckIn);
      setCheckIns((prev) => [newCheckIn, ...prev]);

      // Award XP based on check-in streak
      const streaks = calculateAllStreaks();
      const newStreak = streaks.checkInStreak + 1;
      const xpAmount = 10 + newStreak; // Base 10 + streak length

      const xpEvent: XPEvent = {
        id: `xp-${Date.now()}`,
        date: data.date,
        type: 'check-in-streak',
        amount: xpAmount,
        streakLength: newStreak,
        description: `Check-in streak: ${newStreak} day${newStreak !== 1 ? 's' : ''}`,
        createdAt: now,
      };

      await addXPEventToDB(xpEvent);
      setXPEvents((prev) => [xpEvent, ...prev]);

      // Check for milestone unlock
      if (newStreak > 0 && newStreak % 10 === 0) {
        const milestone = milestones.find(
          (m) => m.type === 'check-in-streak' && m.threshold === newStreak && !m.unlockedAt,
        );
        if (milestone) {
          await unlockMilestoneInDB(milestone.type, milestone.threshold);
          setMilestones((prev) =>
            prev.map((m) => (m.id === milestone.id ? { ...m, unlockedAt: now } : m)),
          );
        }
      }
    },
    [calculateAllStreaks, milestones],
  );

  const removeCheckIn = useCallback(async (date: string) => {
    await removeCheckInFromDB(date);
    setCheckIns((prev) => prev.filter((c) => c.date !== date));
  }, []);

  const getTodayCheckIn = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    return checkIns.find((c) => c.date === today) || null;
  }, [checkIns]);

  const streaks = calculateAllStreaks();
  const level = calculateLevel();
  const unlockedMilestones = milestones.filter((m) => m.unlockedAt !== null);

  return (
    <GamificationContext.Provider
      value={{
        checkIn: getTodayCheckIn(),
        allCheckIns: checkIns,
        xpEvents,
        level,
        milestones,
        unlockedMilestones,
        currentCheckInStreak: streaks.checkInStreak,
        addCheckIn,
        removeCheckIn,
        getTodayCheckIn,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamificationContext() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamificationContext must be used within GamificationProvider');
  }
  return context;
}
