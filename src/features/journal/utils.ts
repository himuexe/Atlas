import { JournalEntry } from './types';

export interface JournalSummary {
  totalEntries: number;
  latestMood?: string;
  latestEnergy?: string;
  insightEntries: number;
  prompt: string;
}

export function summarizeJournalEntries(entries: JournalEntry[]): JournalSummary {
  const sorted = [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latest = sorted[0];

  const insightEntries = sorted.filter((entry) => {
    const content = entry.content.toLowerCase();
    return content.includes('learned') || content.includes('grateful') || content.includes('important') || content.includes('noticed');
  }).length;

  const prompt = latest?.mood || latest?.energy
    ? `Recent reflection: ${latest.mood ?? 'steady'} energy${latest.energy ? ` • ${latest.energy}` : ''}`
    : 'Keep the habit gentle by writing one short reflection each day.';

  return {
    totalEntries: sorted.length,
    latestMood: latest?.mood,
    latestEnergy: latest?.energy,
    insightEntries,
    prompt,
  };
}
