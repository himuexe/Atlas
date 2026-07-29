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
    <article className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-200">{date}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{entry.content}</p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="rounded-3xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
