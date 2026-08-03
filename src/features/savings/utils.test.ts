import { describe, expect, it } from 'vitest';
import { calculateBalance } from './utils';

describe('calculateBalance', () => {
  it('totals positive and negative amounts from savings entries', () => {
    expect(
      calculateBalance([
        { id: '1', amount: 50, description: 'Salary', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: '2', amount: 15, description: 'Bonus', createdAt: '2026-01-02T00:00:00.000Z' },
        { id: '3', amount: -10, description: 'Coffee', createdAt: '2026-01-03T00:00:00.000Z' },
      ]),
    ).toBe(55);
  });

  it('returns zero for an empty list', () => {
    expect(calculateBalance([])).toBe(0);
  });
});
