import { useMemo } from 'react';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { useFocus } from '../focus/FocusContext';
import { useHealth } from '../health/HealthContext';
import { useJournalContext } from '../journal/JournalContext';
import { useStreaksContext } from '../streaks/StreakContext';

export function DashboardOverview() {
  const { items, completedCount } = useFocus();
  const { health } = useHealth();
  const { latestEntry, entries } = useJournalContext();
  const { totalHabits, completedToday, bestStreak } = useStreaksContext();

  const focusSummary = useMemo(() => {
    if (items.length === 0) return 'Choose up to three priorities that will make today feel meaningful.';
    const nextItem = items.find((item) => !item.completed);
    return nextItem ? `Next: ${nextItem.title}` : 'Everything on your list is complete. Let the rest of the day stay open.';
  }, [items]);

  const healthSummary = useMemo(() => {
    const recorded = Object.values(health).filter((value) => value !== null).length;
    return recorded === 0 ? 'No health metrics recorded yet.' : `${recorded} of 4 core metrics recorded today.`;
  }, [health]);

  const journalSummary = useMemo(() => {
    if (!latestEntry) return 'A few lines can make space for what mattered today.';
    return `${new Date(latestEntry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${latestEntry.content.slice(0, 72)}`;
  }, [latestEntry]);

  const dailyPrompt = useMemo(() => {
    if (items.length === 0) return 'Begin with one clear priority. A calm day does not need a crowded list.';
    if (completedCount < items.length) return 'Stay with the next meaningful step before introducing something new.';
    if (entries.length === 0) return 'You made room for action. Take a moment to notice what the day gave you.';
    return 'Your essentials are in view. Keep the rest of the day simple.';
  }, [completedCount, entries.length, items.length]);

  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const focusProgressClass = items.length === 0
    ? 'w-0'
    : completedCount === items.length
      ? 'w-full'
      : items.length === 2
        ? 'w-1/2'
        : completedCount === 1
          ? 'w-1/3'
          : 'w-2/3';

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">{todayLabel}</p>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="page-title">What matters today.</h2>
            <p className="page-copy mt-4">Atlas keeps the essentials visible, so your attention can stay where it belongs.</p>
          </div>
          <p className="max-w-sm text-sm leading-6 text-zinc-500 lg:text-right">{dailyPrompt}</p>
        </div>
      </header>

      <section className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="bg-[#080808] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow">Today’s focus</p>
              <h3 className="mt-4 max-w-xl text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">{focusSummary}</h3>
            </div>
            <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-zinc-400">{completedCount}/{items.length}</span>
          </div>
          <div className="mt-10 h-px bg-white/10">
            <div className={`h-px bg-white ${focusProgressClass}`} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">{items.length === 0 ? 'No priorities selected' : `${items.length - completedCount} remaining`}</p>
        </div>
        <div className="bg-[#080808] p-6 sm:p-8">
          <p className="eyebrow">Daily rhythm</p>
          <dl className="mt-6 space-y-5">
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <dt className="text-sm text-zinc-500">Health</dt>
              <dd className="text-sm font-medium text-white">{Object.values(health).filter((value) => value !== null).length}/4</dd>
            </div>
            <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
              <dt className="text-sm text-zinc-500">Journal</dt>
              <dd className="text-sm font-medium text-white">{entries.length}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="text-sm text-zinc-500">Streaks</dt>
              <dd className="text-sm font-medium text-white">{completedToday}/{totalHabits}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Core spaces</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-white">Keep the essentials close.</h3>
          </div>
          <p className="hidden text-sm text-zinc-500 sm:block">The rest can wait.</p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <DashboardCard title="Today’s Focus" description={focusSummary} badge={`${completedCount}/${items.length}`} to="/focus" actionLabel="Review" />
          <DashboardCard title="Health Snapshot" description={healthSummary} to="/health" actionLabel="Open" />
          <DashboardCard title="Journal" description={journalSummary} badge={`${entries.length} saved`} to="/journal" actionLabel="Write" />
          <DashboardCard title="Streaks" description={totalHabits === 0 ? 'Choose a habit and let consistency build quietly.' : `${completedToday}/${totalHabits} complete today · best streak ${bestStreak}`} to="/streaks" actionLabel="View" />
        </div>
      </section>
    </div>
  );
}
