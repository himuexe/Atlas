import { FormEvent, useState } from 'react';

interface GoalInputFormProps {
  onAdd: (title: string, note?: string) => void;
}

export function GoalInputForm({ onAdd }: GoalInputFormProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAdd(title, note);
    setTitle('');
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-black/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">New goal</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Keep one small promise to yourself</h3>
      </div>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Save ₹5,000 this month"
        className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
      />
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="Optional note or support detail"
        className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
      />
      <button type="submit" className="w-full rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200">
        Add goal
      </button>
    </form>
  );
}
