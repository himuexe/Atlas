import { FormEvent, useState } from 'react';

interface FocusInputFormProps {
  onAdd: (title: string) => void;
  disabled: boolean;
  maxItems: number;
}

export function FocusInputForm({ onAdd, disabled, maxItems }: FocusInputFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || disabled) {
      return;
    }

    onAdd(title);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-sm shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Add focus</p>
          <h3 className="text-2xl font-semibold text-white">Three priority items</h3>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
          {maxItems} slots
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={title}
          disabled={disabled}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add your most important task"
          className="min-w-0 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {disabled ? (
        <p className="text-sm leading-6 text-slate-500">
          You have reached the maximum of {maxItems} focus items. Mark an item complete or remove it to add a new one.
        </p>
      ) : (
        <p className="text-sm leading-6 text-slate-500">Create a concise task that guides your day.</p>
      )}
    </form>
  );
}
