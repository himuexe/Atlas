import { describe, expect, it } from 'vitest';
import { calculateBestStreak, calculateCurrentStreak, getLastSevenDayStatuses } from './utils';

describe('habit streak schedules', () => {
  it('skips scheduled rest days when calculating current and best streaks', () => {
    const history = ['2026-10-09', '2026-10-12', '2026-10-13'];
    const restDays = [0, 6]; // Sunday and Saturday

    expect(calculateCurrentStreak(history, restDays, '2026-10-14')).toBe(3);
    expect(calculateBestStreak(history, restDays)).toBe(3);
  });

  it('includes only completed scheduled days in the weekly view', () => {
    const statuses = getLastSevenDayStatuses(
      ['2026-10-12', '2026-10-14'],
      [0, 6],
      '2026-10-14',
    );

    expect(statuses.map(({ status }) => status)).toEqual([
      'incomplete', 'incomplete', 'rest', 'rest', 'completed', 'incomplete', 'completed',
    ]);
  });

  it('lets a newly planned rest day bridge an existing streak across that weekday', () => {
    const history = ['2026-10-12', '2026-10-14']; // Monday and Wednesday

    expect(calculateCurrentStreak(history, [], '2026-10-14')).toBe(1);
    expect(calculateCurrentStreak(history, [2], '2026-10-14')).toBe(2); // Tuesday becomes a rest day
  });

  it('does not require completion on a rest day today', () => {
    expect(calculateCurrentStreak(['2026-10-16'], [6], '2026-10-17')).toBe(1);
  });
});
