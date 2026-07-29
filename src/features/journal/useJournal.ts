import { useCallback, useMemo, useState } from 'react';
import { JournalEntry } from './types';

function createEntry(content: string): JournalEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function useJournal(initialEntries: JournalEntry[] = []) {
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [query, setQuery] = useState('');

  const addEntry = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    setEntries((current) => [createEntry(trimmed), ...current]);
    setQuery('');
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const filteredEntries = useMemo(
    () => entries.filter((entry) => entry.content.toLowerCase().includes(query.toLowerCase())),
    [entries, query],
  );

  const latestEntry = useMemo(() => entries[0] ?? null, [entries]);

  return {
    entries,
    filteredEntries,
    latestEntry,
    query,
    setQuery,
    addEntry,
    removeEntry,
  };
}
