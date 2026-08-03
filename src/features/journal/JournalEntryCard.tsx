import { JournalEntry } from './types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

export function JournalEntryCard({ entry, onDelete }: JournalEntryCardProps) {
  const date = new Date(entry.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <article className="rounded-[22px] border border-white/10 bg-[#060606]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-200">{date}</p>
          {(entry.mood || entry.energy) ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {entry.mood ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-zinc-300">Mood: {entry.mood}</span> : null}
              {entry.energy ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-zinc-300">Energy: {entry.energy}</span> : null}
            </div>
          ) : null}
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{entry.content}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
