const pad = (value: number) => String(value).padStart(2, '0');

export function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function calculateVisitStreak(visitDays: string[], today = getLocalDateKey(new Date())): number {
  const visits = new Set(visitDays);
  const yesterday = shiftDateKey(today, -1);
  let cursor = visits.has(today) ? today : yesterday;

  if (!visits.has(cursor)) {
    return 0;
  }

  let streak = 0;
  while (visits.has(cursor)) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}
