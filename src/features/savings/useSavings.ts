import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSavingsEntriesFromDB, replaceSavingsEntriesInDB } from '../../lib/persistence/sqlite';
import { SavingsEntry } from './types';
import { calculateBalance } from './utils';

function createEntry(amount: number, description: string, category: 'income' | 'expense' | 'savings'): SavingsEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    amount,
    description: description.trim(),
    category,
    createdAt: new Date().toISOString(),
  };
}

export function useSavings(initialEntries: SavingsEntry[] = []) {
  const [entries, setEntries] = useState<SavingsEntry[]>(initialEntries);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const persistedEntries = await getSavingsEntriesFromDB();
        if (mounted && persistedEntries.length > 0) {
          setEntries(persistedEntries);
        }
      } catch (err) {
        console.error('Failed to load savings entries from DB', err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const syncEntries = useCallback(async (nextEntries: SavingsEntry[]) => {
    try {
      await replaceSavingsEntriesInDB(nextEntries);
    } catch (err) {
      console.error('Failed to persist savings entries', err);
    }
  }, []);

  const addEntry = useCallback((amount: number, description: string, category: 'income' | 'expense' | 'savings') => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription || Number.isNaN(amount)) {
      return;
    }

    const nextEntry = createEntry(amount, trimmedDescription, category);
    setEntries((current) => {
      const nextEntries = [nextEntry, ...current];
      void syncEntries(nextEntries);
      return nextEntries;
    });
  }, [syncEntries]);

  const removeEntry = useCallback((id: string) => {
    setEntries((current) => {
      const nextEntries = current.filter((entry) => entry.id !== id);
      void syncEntries(nextEntries);
      return nextEntries;
    });
  }, [syncEntries]);

  const reset = useCallback(() => {
    setEntries([]);
    void syncEntries([]);
  }, [syncEntries]);

  const balance = useMemo(() => calculateBalance(entries), [entries]);

  return {
    entries,
    addEntry,
    removeEntry,
    reset,
    balance,
  };
}
