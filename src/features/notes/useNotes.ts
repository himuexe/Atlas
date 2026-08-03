import { useCallback, useEffect, useMemo, useState } from 'react';
import { Note } from './types';

function createNote(title: string, content: string): Note {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

export function useNotes(initialNotes: Note[] = []) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  useEffect(() => {
    const stored = window.localStorage.getItem('atlas-notes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Note[];
        setNotes(parsed);
      } catch {
        window.localStorage.removeItem('atlas-notes');
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('atlas-notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = useCallback((title: string, content: string) => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    const nextNote = createNote(trimmedTitle, trimmedContent);
    setNotes((current) => [nextNote, ...current]);
  }, []);

  const removeNote = useCallback((id: string) => {
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  const latestNote = useMemo(() => notes[0] ?? null, [notes]);

  return {
    notes,
    latestNote,
    addNote,
    removeNote,
  };
}
