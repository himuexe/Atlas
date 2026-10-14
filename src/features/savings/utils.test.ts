import { describe, expect, it } from 'vitest';
import { calculateBalance } from './utils';

describe('calculateBalance', () => {
  it('uses categories to determine the sign, including legacy negative expenses', () => {
    expect(
      calculateBalance([
        { id: '1', amount: 50, description: 'Salary', category: 'income', createdAt: '2026-01-01T00:00:00.000Z' },
        { id: '2', amount: 15, description: 'Transfer', category: 'savings', createdAt: '2026-01-02T00:00:00.000Z' },
        { id: '3', amount: 10, description: 'Coffee', category: 'expense', createdAt: '2026-01-03T00:00:00.000Z' },
        { id: '4', amount: -5, description: 'Legacy expense', category: 'expense', createdAt: '2026-01-04T00:00:00.000Z' },
        { id: '5', amount: -2, description: 'Legacy income', category: 'income', createdAt: '2026-01-05T00:00:00.000Z' },
      ]),
    ).toBe(52);
  });

  it('returns zero for an empty list', () => {
    expect(calculateBalance([])).toBe(0);
  });
});
