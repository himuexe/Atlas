import { describe, expect, it } from 'vitest';
import { summarizeJournalEntries } from './utils';

describe('summarizeJournalEntries', () => {
  it('builds a simple reflection summary from recent entries', () => {
    const summary = summarizeJournalEntries([
      { id: '1', content: 'I felt calm and grateful today.', mood: 'calm', energy: 'steady', createdAt: '2026-08-01T10:00:00.000Z' },
      { id: '2', content: 'I learned to pause before reacting.', mood: 'focused', createdAt: '2026-08-02T10:00:00.000Z' },
    ]);

    expect(summary.totalEntries).toBe(2);
    expect(summary.latestMood).toBe('focused');
    expect(summary.latestEnergy).toBeUndefined();
    expect(summary.insightEntries).toBe(2);
  });
});
