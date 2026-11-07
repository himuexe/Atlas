import { describe, expect, it } from 'vitest';
import { buildLifeDashboardSnapshot, calculateAge, type LifeDashboardSource } from './dashboard';
import { createBuiltInLifeDimensions } from './dimensions';

describe('Life dashboard model', () => {
  const emptySource = (): LifeDashboardSource => ({
    profile: null,
    currentSelf: null,
    idealSelf: null,
    dimensions: createBuiltInLifeDimensions('2026-01-01T00:00:00.000Z'),
    attributes: [],
    entries: [],
    targets: [],
    personalValues: [],
    personality: { traits: [], definitions: [], reflections: [], examples: [] },
    healthSnapshot: null,
    savingsEntries: [],
    journal: { entryCount: 0, latestEntryAt: null },
  });

  it('calculates age by local calendar date and rejects invalid or future dates', () => {
    expect(calculateAge('2000-11-06', new Date(2026, 10, 5))).toBe(25);
    expect(calculateAge('2000-11-06', new Date(2026, 10, 6))).toBe(26);
    expect(calculateAge('2000-02-29', new Date(2026, 1, 28))).toBe(25);
    expect(calculateAge('2000-02-29', new Date(2026, 2, 1))).toBe(26);
    expect(calculateAge('2027-01-01', new Date(2026, 10, 6))).toBeNull();
    expect(calculateAge('2001-02-29', new Date(2026, 10, 6))).toBeNull();
  });

  it('keeps all 20 canonical dimensions and custom dimensions in separate groups', () => {
    const source = emptySource();
    source.dimensions.push({
      id: 'custom-community',
      name: 'Community',
      description: 'A custom dimension',
      isBuiltIn: false,
      isActive: true,
      position: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const snapshot = buildLifeDashboardSnapshot(source);

    expect(snapshot.canonicalDimensions).toHaveLength(20);
    expect(snapshot.customDimensions.map(({ dimension }) => dimension.id)).toEqual(['custom-community']);
  });

  it('keeps missing values distinct and calculates only the labeled savings-ledger balance', () => {
    const source = emptySource();
    source.savingsEntries = [
      { amount: 25, category: 'income' },
      { amount: 8, category: 'expense' },
      { amount: 12, category: 'savings' },
    ];
    source.journal = { entryCount: 1, latestEntryAt: '2026-11-05T10:00:00.000Z' };

    const snapshot = buildLifeDashboardSnapshot(source);

    expect(snapshot.canonicalDimensions[0].attributes).toEqual([]);
    expect(snapshot.savings).toEqual({ ledgerBalance: 29, entryCount: 3 });
    expect(snapshot.journal).toEqual({ entryCount: 1, latestEntryAt: '2026-11-05T10:00:00.000Z' });
  });
});
