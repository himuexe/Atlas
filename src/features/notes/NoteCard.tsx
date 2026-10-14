import { FormEvent, useState } from 'react';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    createdAt: string;
  };
  onUpdate: (id: string, title: string, content: string) => void;
  onRemove: (id: string) => void;
}

export function NoteCard({ note, onUpdate, onRemove }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const cancelEditing = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
  };

  const saveEditing = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onUpdate(note.id, title, content);
    setIsEditing(false);
  };

  return (
    <div className="rounded-[22px] border border-white/10 bg-[#060606]/90 px-4 py-4">
      {isEditing ? (
        <form onSubmit={saveEditing} className="space-y-3">
          <label className="block text-sm text-zinc-300">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Note
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm leading-6 text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={cancelEditing} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim() || !content.trim()} className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50">
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">{note.title}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{note.content}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(note.id)}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
