import { FormEvent, useState } from 'react';

interface JournalInputFormProps {
  onCreate: (content: string) => void;
}

export function JournalInputForm({ onCreate }: JournalInputFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }

    onCreate(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">New Entry</p>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={6}
          placeholder="Write a short reflection, a win, or a lesson from today..."
          className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
        />
      </div>
      <button
        type="submit"
        className="inline-flex items-center rounded-3xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        Save entry
      </button>
    </form>
  );
}
