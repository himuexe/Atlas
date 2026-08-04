import { useCallback, useEffect, useMemo, useState } from 'react';
import { getNotesFromDB, replaceNotesInDB } from '../../lib/persistence/sqlite';
import { Note } from './types';

const LEGACY_STORAGE_KEY = 'atlas-notes';

function createNote(title: string, content: string): Note {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
}

function getLegacyNotes(): Note[] {
  try {
    const stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Note[]) : [];
  } catch {
    return [];
  }
}

export function useNotes(initialNotes: Note[] = []) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const persistedNotes = await getNotesFromDB();
        const nextNotes = persistedNotes.length > 0 ? persistedNotes : getLegacyNotes();

        if (persistedNotes.length === 0 && nextNotes.length > 0) {
          await replaceNotesInDB(nextNotes);
        }
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);

        if (mounted) {
          setNotes(nextNotes);
        }
      } catch (error) {
        console.error('Failed to load notes from DB', error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const syncNotes = useCallback(async (nextNotes: Note[]) => {
    try {
      await replaceNotesInDB(nextNotes);
    } catch (error) {
      console.error('Failed to persist notes', error);
    }
  }, []);

  const addNote = useCallback((title: string, content: string) => {
    if (!title.trim() || !content.trim()) return;

    const nextNote = createNote(title, content);
    setNotes((current) => {
      const nextNotes = [nextNote, ...current];
      void syncNotes(nextNotes);
      return nextNotes;
    });
  }, [syncNotes]);

  const removeNote = useCallback((id: string) => {
    setNotes((current) => {
      const nextNotes = current.filter((note) => note.id !== id);
      void syncNotes(nextNotes);
      return nextNotes;
    });
  }, [syncNotes]);

  const reset = useCallback(() => {
    setNotes([]);
    void syncNotes([]);
  }, [syncNotes]);

  const latestNote = useMemo(() => notes[0] ?? null, [notes]);

  return { notes, latestNote, addNote, removeNote, reset };
}
