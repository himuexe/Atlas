import { FormEvent, useState } from 'react';

interface JournalInputFormProps {
  onCreate: (content: string, mood?: string, energy?: string) => void;
}

export function JournalInputForm({ onCreate }: JournalInputFormProps) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    onCreate(content, mood, energy);
    setContent('');
    setMood('');
    setEnergy('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-black/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">New Entry</p>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          placeholder="Write a short reflection, a win, or a lesson from today..."
          className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={mood}
            onChange={(event) => setMood(event.target.value)}
            placeholder="Mood (optional)"
            className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          <input
            value={energy}
            onChange={(event) => setEnergy(event.target.value)}
            placeholder="Energy (optional)"
            className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex items-center rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
      >
        Save entry
      </button>
    </form>
  );
}
