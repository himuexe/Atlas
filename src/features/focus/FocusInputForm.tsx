import { FormEvent, useState } from 'react';

interface FocusInputFormProps {
  onAdd: (title: string, note?: string) => void;
  disabled: boolean;
  maxItems: number;
}

export function FocusInputForm({ onAdd, disabled, maxItems }: FocusInputFormProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || disabled) {
      return;
    }

    onAdd(title, note);
    setTitle('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-[24px] border border-white/10 bg-black/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">Add focus</p>
          <h3 className="text-2xl font-semibold text-white">Three priority items</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-zinc-300">
          {maxItems} slots
        </span>
      </div>

      <div className="grid gap-3">
        <input
          value={title}
          disabled={disabled}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add your most important task"
          className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
        <textarea
          value={note}
          disabled={disabled}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="Optional next step or context"
          className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {disabled ? (
        <p className="text-sm leading-6 text-slate-500">
          You have reached the maximum of {maxItems} focus items. Mark an item complete or remove it to add a new one.
        </p>
      ) : (
        <p className="text-sm leading-6 text-zinc-500">Create a concise task that guides your day.</p>
      )}
    </form>
  );
}
