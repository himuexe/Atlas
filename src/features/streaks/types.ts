export interface StreakHabit {
  id: string;
  name: string;
  history: string[];
  /** JavaScript weekday numbers (0 = Sunday through 6 = Saturday). */
  restDays: number[];
  createdAt: string;
}
