import { useNotesContext } from './NotesContext';
import { NoteCard } from './NoteCard';
import { NoteInputForm } from './NoteInputForm';
import { AnimatePresence } from 'motion/react';

export function NotesFeature() {
  const { notes, latestNote, addNote, updateNote, removeNote } = useNotesContext();
  const earlierNotes = latestNote ? notes.filter((note) => note.id !== latestNote.id) : notes;

  return (
    <div className="notes-feature space-y-6">
      <header className="feature-heading border-b border-white/10 pb-8">
        <p className="eyebrow">📝 Personal notes</p>
        <h2 className="page-title mt-4">Keep a few favorite thoughts close at hand.</h2>
        <p className="page-copy mt-4">
          Notes are for the small reflections, reminders, and lessons that deserve a little space.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4 rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Latest note</p>
            {latestNote ? (
              <div className="mt-3">
                <AnimatePresence initial={false}>
                  <NoteCard key={latestNote.id} note={latestNote} onUpdate={updateNote} onRemove={removeNote} />
                </AnimatePresence>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">No notes yet. Save a thought to make it easier to remember later.</p>
            )}
          </div>

          {earlierNotes.length > 0 ? (
            <div className="space-y-3">
              <h3 className="px-1 text-[11px] uppercase tracking-[0.32em] text-zinc-500">Earlier notes</h3>
              <AnimatePresence initial={false}>
                {earlierNotes.map((note) => (
                  <NoteCard key={note.id} note={note} onUpdate={updateNote} onRemove={removeNote} />
                ))}
              </AnimatePresence>
            </div>
          ) : null}
        </section>

        <NoteInputForm onAdd={addNote} />
      </div>
    </div>
  );
}
