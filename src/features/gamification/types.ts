/**
 * Daily Check-in for mood, energy, intention, win, and reflection
 */
export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 'poor' | 'neutral' | 'good' | 'great';
  energy: 'low' | 'medium' | 'high';
  intention: string;
  win: string;
  reflection: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * XP event for auditability - track all XP-earning actions
 */
export interface XPEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'check-in-streak' | 'habit-streak' | 'focus-streak';
  amount: number;
  streakLength: number; // current streak length at time of earning
  description: string;
  createdAt: string;
}

/**
 * Personal level calculated from cumulative XP
 */
export interface PersonalLevel {
  level: number;
  totalXP: number;
  xpForNextLevel: number;
  progressPercentage: number; // 0-100, progress to next level
}

/**
 * Milestone tracking
 */
export interface Milestone {
  id: string;
  type: 'check-in-streak';
  threshold: number; // e.g., 10, 20, 30 days
  unlockedAt: string | null;
  description: string;
}

/**
 * Weekly recap summary
 */
export interface WeeklyRecap {
  week: string; // YYYY-Www format (ISO week)
  checkInCount: number;
  checkInStreak: number;
  totalXPEarned: number;
  milestonesUnlocked: Milestone[];
  habitStreaks: { name: string; streak: number }[];
}
