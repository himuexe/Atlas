import { FormEvent, useState } from 'react';

interface StreakInputFormProps {
  onCreate: (name: string) => void;
}

export function StreakInputForm({ onCreate }: StreakInputFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    onCreate(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">New habit</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name a habit to track"
          className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Add habit
      </button>
    </form>
  );
}
