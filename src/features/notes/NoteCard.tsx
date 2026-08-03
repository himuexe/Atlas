interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  };
  onRemove: (id: string) => void;
}

export function NoteCard({ note, onRemove }: NoteCardProps) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-[#060606]/90 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{note.title}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{note.content}</p>
        </div>
        <button
          type="button"
          onClick={() => onRemove(note.id)}
          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
