import { useMemo } from 'react';
import { JournalInputForm } from './JournalInputForm';
import { JournalEntryCard } from './JournalEntryCard';
import { useJournalContext } from './JournalContext';

export function JournalFeature() {
  const { filteredEntries, query, setQuery, addEntry, removeEntry, entries, latestEntry } = useJournalContext();

  const introText = useMemo(() => {
    if (!entries.length) {
      return 'Start your first journal entry to capture today’s reflections and keep your thinking clear.';
    }

    return `You have ${entries.length} journal ${entries.length === 1 ? 'entry' : 'entries'}.`; 
  }, [entries.length]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Journal</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Capture your daily reflections</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">{introText}</p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Latest reflection</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{latestEntry ? 'Most recent entry' : 'No entries yet'}</h3>
              </div>
              <span className="rounded-3xl bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                {entries.length} total
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              {latestEntry ? latestEntry.content.slice(0, 180) : 'Create a short entry to begin building the habit of reflection.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Search entries</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Find past reflections</h3>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search journal entries"
                className="w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 sm:w-auto"
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Search works across all saved entries and helps you review what mattered most.
            </p>
          </div>

          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-sm text-slate-400">
                {query ? 'No entries match your search.' : 'No journal entries yet. Add one to start tracking your reflections.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <JournalEntryCard key={entry.id} entry={entry} onDelete={removeEntry} />
                ))}
              </div>
            )}
          </div>
        </div>

        <JournalInputForm onCreate={addEntry} />
      </div>
    </div>
  );
}
