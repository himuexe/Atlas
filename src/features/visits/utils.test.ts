import { describe, expect, it } from 'vitest';
import { calculateVisitStreak, getLocalDateKey } from './utils';

describe('visit streak date handling', () => {
  it('uses the local calendar date around midnight', () => {
    expect(getLocalDateKey(new Date(2026, 9, 14, 23, 59))).toBe('2026-10-14');
    expect(getLocalDateKey(new Date(2026, 9, 15, 0, 1))).toBe('2026-10-15');
  });

  it('counts consecutive visits over a year boundary', () => {
    expect(calculateVisitStreak(['2025-12-31', '2026-01-01'], '2026-01-01')).toBe(2);
  });

  it('keeps a yesterday streak active until a visit is recorded today', () => {
    expect(calculateVisitStreak(['2026-10-13'], '2026-10-14')).toBe(1);
    expect(calculateVisitStreak(['2026-10-12'], '2026-10-14')).toBe(0);
  });
});
