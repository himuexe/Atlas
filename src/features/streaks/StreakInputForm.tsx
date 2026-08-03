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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">New habit</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name a habit to track"
          className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black"
      >
        Add habit
      </button>
    </form>
  );
}
