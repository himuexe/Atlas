import { useNotesContext } from './NotesContext';
import { NoteCard } from './NoteCard';
import { NoteInputForm } from './NoteInputForm';

export function NotesFeature() {
  const { notes, latestNote, addNote, removeNote } = useNotesContext();

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">Personal notes</p>
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
                <p className="text-sm font-semibold text-white">{latestNote.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{latestNote.content}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-400">No notes yet. Save a thought to make it easier to remember later.</p>
            )}
          </div>

          {notes.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
              Your notes will appear here in reverse chronological order.
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} onRemove={removeNote} />
              ))}
            </div>
          )}
        </section>

        <NoteInputForm onAdd={addNote} />
      </div>
    </div>
  );
}
