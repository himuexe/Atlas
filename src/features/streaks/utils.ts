export type HabitDayStatus = 'completed' | 'incomplete' | 'rest';

const pad = (value: number) => String(value).padStart(2, '0');

export function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function getWeekdayForDateKey(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isRestDay(dateKey: string, restDays: number[]): boolean {
  return restDays.includes(getWeekdayForDateKey(dateKey));
}

export function calculateCurrentStreak(
  history: string[],
  restDays: number[],
  today = getLocalDateKey(new Date()),
): number {
  const completedDates = new Set(history);
  if (completedDates.size === 0 || restDays.length >= 7) return 0;

  const earliestDate = [...completedDates].sort()[0];
  let cursor = today;
  if (!isRestDay(today, restDays) && !completedDates.has(today)) {
    cursor = shiftDateKey(today, -1);
  }

  let streak = 0;
  while (cursor >= earliestDate) {
    if (isRestDay(cursor, restDays)) {
      cursor = shiftDateKey(cursor, -1);
      continue;
    }
    if (!completedDates.has(cursor)) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export function calculateBestStreak(history: string[], restDays: number[]): number {
  const completedDates = new Set(history);
  if (completedDates.size === 0 || restDays.length >= 7) return 0;

  const sortedDates = [...completedDates].sort();
  let cursor = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  let currentStreak = 0;
  let bestStreak = 0;

  while (cursor <= lastDate) {
    if (isRestDay(cursor, restDays)) {
      cursor = shiftDateKey(cursor, 1);
      continue;
    }
    if (completedDates.has(cursor)) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    cursor = shiftDateKey(cursor, 1);
  }

  return bestStreak;
}

export function getLastSevenDayStatuses(
  history: string[],
  restDays: number[],
  today = getLocalDateKey(new Date()),
): Array<{ date: string; weekday: string; status: HabitDayStatus }> {
  const completedDates = new Set(history);
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDateKey(today, index - 6);
    const status: HabitDayStatus = isRestDay(date, restDays)
      ? 'rest'
      : completedDates.has(date)
        ? 'completed'
        : 'incomplete';
    return { date, weekday: weekdays[getWeekdayForDateKey(date)], status };
  });
}
