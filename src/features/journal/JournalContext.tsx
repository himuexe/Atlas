import { createContext, ReactNode, useContext } from 'react';
import { useJournal } from './useJournal';
import { JournalEntry } from './types';

interface JournalContextValue {
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  latestEntry: JournalEntry | null;
  query: string;
  setQuery: (query: string) => void;
  addEntry: (content: string) => void;
  removeEntry: (id: string) => void;
}

const JournalContext = createContext<JournalContextValue | null>(null);

interface JournalProviderProps {
  children: ReactNode;
}

export function JournalProvider({ children }: JournalProviderProps) {
  const journal = useJournal();

  return <JournalContext.Provider value={journal}>{children}</JournalContext.Provider>;
}

export function useJournalContext() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournalContext must be used within a JournalProvider');
  }
  return context;
}
