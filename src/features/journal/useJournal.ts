import { useCallback, useEffect, useMemo, useState } from 'react';
import { JournalEntry } from './types';
import { getJournalEntriesFromDB, addJournalEntryToDB, removeJournalEntryFromDB, initDatabase } from '../../lib/persistence/sqlite';

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

  // Load persisted entries on mount (if DB available)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDatabase();
        const persisted = await getJournalEntriesFromDB();
        if (mounted && persisted.length) {
          setEntries(persisted);
        }
      } catch (err) {
        // If persistence fails, silently fall back to in-memory
        // The app should remain usable even without DB.
        // eslint-disable-next-line no-console
        console.error('Failed to load journal entries from DB', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const addEntry = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    const entry = createEntry(trimmed);
    setEntries((current) => [entry, ...current]);
    setQuery('');

    // Persist in background
    addJournalEntryToDB(entry).catch((err) => console.error('Failed to persist journal entry', err));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
    removeJournalEntryFromDB(id).catch((err) => console.error('Failed to remove journal entry from DB', err));
  }, []);

  const reset = useCallback(() => {
    setEntries([]);
    setQuery('');

    (async () => {
      try {
        await initDatabase();
        const { clearJournalEntries } = await import('../../lib/persistence/sqlite');
        await clearJournalEntries();
      } catch (err) {
        console.error('Failed to reset DB journal table', err);
      }
    })();
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
    reset,
  };
}
