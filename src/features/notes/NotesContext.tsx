import { createContext, ReactNode, useContext } from 'react';
import { useNotes } from './useNotes';
import { Note } from './types';

interface NotesContextValue {
  notes: Note[];
  latestNote: Note | null;
  addNote: (title: string, content: string) => void;
  removeNote: (id: string) => void;
  reset: () => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

interface NotesProviderProps {
  children: ReactNode;
}

export function NotesProvider({ children }: NotesProviderProps) {
  const notes = useNotes();
  return <NotesContext.Provider value={notes}>{children}</NotesContext.Provider>;
}

export function useNotesContext() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
}
