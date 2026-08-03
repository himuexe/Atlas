export interface FocusItem {
  id: string; // UUID
  title: string;
  notes?: string;
  position?: number;
  completed: boolean;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
}

export interface JournalEntry {
  id: string;
  date: string; // ISO date (day)
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type HealthMetricType = 'weight' | 'water' | 'sleep' | 'workout' | string;

export interface HealthMetric {
  id: string;
  metricType: HealthMetricType;
  date: string; // ISO
  value: number;
  notes?: string;
  createdAt: string;
}

export interface Streak {
  id: string;
  habitName: string;
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate?: string; // ISO
}

export interface SettingRecord {
  key: string; // primary key
  value: any;
  updatedAt?: string;
}
