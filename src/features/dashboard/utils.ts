import { FocusItem } from '../focus/types';
import { JournalEntry } from '../journal/types';
import { SavingsEntry } from '../savings/types';

export interface WeeklySnapshot {
  focusCompletionRate: number;
  journalEntriesThisWeek: number;
  savingsEntriesThisWeek: number;
  prompt: string;
}

function isWithinCurrentWeek(value: string) {
  const date = new Date(value);
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return date >= start && date <= end;
}

export function summarizeWeek(
  focusItems: FocusItem[],
  journalEntries: JournalEntry[],
  savingsEntries: SavingsEntry[],
): WeeklySnapshot {
  const focusItemsThisWeek = focusItems.filter((item) => isWithinCurrentWeek(item.createdAt));
  const completedThisWeek = focusItemsThisWeek.filter((item) => item.completed).length;
  const focusCompletionRate = focusItemsThisWeek.length > 0 ? completedThisWeek / focusItemsThisWeek.length : 0;

  const journalEntriesThisWeek = journalEntries.filter((entry) => isWithinCurrentWeek(entry.createdAt)).length;
  const savingsEntriesThisWeek = savingsEntries.filter((entry) => isWithinCurrentWeek(entry.createdAt)).length;

  const focusLabel = focusItemsThisWeek.length > 0
    ? `${Math.round(focusCompletionRate * 100)}% of this week’s focus items are complete`
    : 'No focus items created this week yet';

  const prompt = `Weekly pulse: ${focusLabel} • ${journalEntriesThisWeek} journal ${journalEntriesThisWeek === 1 ? 'entry' : 'entries'} • ${savingsEntriesThisWeek} savings ${savingsEntriesThisWeek === 1 ? 'entry' : 'entries'}`;

  return {
    focusCompletionRate,
    journalEntriesThisWeek,
    savingsEntriesThisWeek,
    prompt,
  };
}
