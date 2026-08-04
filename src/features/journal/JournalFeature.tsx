import { useMemo } from 'react';
import { JournalInputForm } from './JournalInputForm';
import { JournalEntryCard } from './JournalEntryCard';
import { useJournalContext } from './JournalContext';
import { summarizeJournalEntries } from './utils';

export function JournalFeature() {
  const { filteredEntries, query, setQuery, addEntry, removeEntry, entries, latestEntry } = useJournalContext();

  const summary = useMemo(() => summarizeJournalEntries(entries), [entries]);

  const introText = useMemo(() => {
    if (!entries.length) {
      return 'Start your first journal entry to capture today’s reflections and keep your thinking clear.';
    }

    return `You have ${summary.totalEntries} journal ${summary.totalEntries === 1 ? 'entry' : 'entries'}.`; 
  }, [entries.length, summary.totalEntries]);

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">Journal</p>
        <h2 className="page-title mt-4">Capture your daily reflections.</h2>
        <p className="page-copy mt-4">{introText}</p>
      </header>

      <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Reflection prompt</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          What felt meaningful today, and what would you want to remember tomorrow?
        </p>
        {summary.totalEntries > 0 ? (
          <p className="mt-3 text-sm text-zinc-300">{summary.prompt}</p>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Latest reflection</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{latestEntry ? 'Most recent entry' : 'No entries yet'}</h3>
              </div>
              <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
                {entries.length} total
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {latestEntry ? latestEntry.content.slice(0, 180) : 'Create a short entry to begin building the habit of reflection.'}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Search entries</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Find past reflections</h3>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search journal entries"
                className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10 sm:w-auto"
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Search works across all saved entries and helps you review what mattered most.
            </p>
          </div>

          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
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
