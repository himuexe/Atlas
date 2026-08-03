import { useMemo } from 'react';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { useFocus } from '../focus/FocusContext';
import { useHealth } from '../health/HealthContext';
import { useJournalContext } from '../journal/JournalContext';
import { useStreaksContext } from '../streaks/StreakContext';
import { useSavingsContext } from '../savings/SavingsContext';
import { useGoalsContext } from '../goals/GoalsContext';
import { useNotesContext } from '../notes/NotesContext';
import { summarizeWeek } from './utils';

const healthCards = [
  { title: 'Sleep', description: 'Rest and recovery are the foundation of a calm day.' },
  { title: 'Water', description: 'Stay hydrated with a simple daily habit.' },
  { title: 'Movement', description: 'Capture your current workout or activity status.' },
];

export function DashboardOverview() {
  const { items, completedCount } = useFocus();
  const { health } = useHealth();

  const focusSummary = useMemo(() => {
    if (items.length === 0) {
      return 'No focus items yet. Add your first priority.';
    }

    const nextItem = items.find((item) => !item.completed);
    return nextItem ? `Next: ${nextItem.title}` : 'All focus items are complete for today.';
  }, [items]);

  const healthSummary = useMemo(() => {
    const recorded = Object.entries(health)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => `${key}: ${value}`);

    return recorded.length > 0 ? recorded.join(', ') : 'No health metrics recorded yet.';
  }, [health]);

  const { latestEntry, entries } = useJournalContext();
  const { totalHabits, completedToday, bestStreak } = useStreaksContext();
  const { balance, entries: savingsEntries } = useSavingsContext();
  const { goals, completedCount: completedGoalsCount } = useGoalsContext();
  const { notes } = useNotesContext();

  const journalSummary = useMemo(() => {
    if (!entries.length) {
      return 'No journal entries yet.';
    }

    return latestEntry ? `${new Date(latestEntry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${latestEntry.content.slice(0, 50)}` : 'Review your recent entry.';
  }, [entries.length, latestEntry]);

  const streakSummary = useMemo(() => {
    if (totalHabits === 0) {
      return 'No streaks yet. Add a habit to begin tracking consistency.';
    }
    return `${completedToday}/${totalHabits} done today · best streak ${bestStreak}`;
  }, [completedToday, totalHabits, bestStreak]);

  const savingsSummary = useMemo(() => `Balance ${balance.toFixed(2)}`, [balance]);

  const weeklySnapshot = useMemo(
    () => summarizeWeek(items, entries, savingsEntries),
    [entries, items, savingsEntries],
  );

  const monthlyReview = useMemo(() => {
    const currentMonth = new Date().toLocaleDateString(undefined, { month: 'long' });
    const focusCompleted = items.filter((item) => item.completed).length;
    const focusRate = items.length > 0 ? Math.round((focusCompleted / items.length) * 100) : 0;
    const journalCount = entries.length;
    const goalCount = goals.length;
    const noteCount = notes.length;

    if (journalCount === 0 && items.length === 0 && goalCount === 0) {
      return {
        headline: `Your ${currentMonth} review is still empty.`,
        body: 'Start with one focus priority, one reflection, and one small goal so the month feels intentional.',
      };
    }

    return {
      headline: `Momentum this ${currentMonth}: ${focusRate}% of your focus items are complete.`,
      body: `${journalCount} journal ${journalCount === 1 ? 'entry' : 'entries'}, ${goalCount} ${goalCount === 1 ? 'goal' : 'goals'}, and ${noteCount} ${noteCount === 1 ? 'note' : 'notes'} are shaping your month so far.`,
    };
  }, [entries.length, goals.length, items, notes.length]);

  const dailyPrompt = useMemo(() => {
    if (items.length === 0) {
      return 'Choose your top priorities first so the day starts with clarity.';
    }

    if (completedCount < items.length) {
      return 'One unfinished priority remains. Finish the next step before adding more.';
    }

    if (Object.values(health).filter((value) => value !== null).length === 0) {
      return 'Capture a quick health snapshot to keep your wellbeing in view.';
    }

    if (entries.length === 0) {
      return 'Write one short reflection to make space for what mattered today.';
    }

    if (completedToday < totalHabits) {
      return 'A small streak check-in can keep the day grounded and consistent.';
    }

    return 'Your day is looking steady. Keep the momentum calm and intentional.';
  }, [completedCount, completedToday, entries.length, health, items.length, totalHabits]);

  const statusHighlights = useMemo(
    () => [
      {
        title: 'Focus',
        message: items.length === 0 ? 'No focus priorities yet.' : `${completedCount}/${items.length} focus items complete.`,
      },
      {
        title: 'Health',
        message: Object.values(health).filter((value) => value !== null).length === 0
          ? 'No health metrics logged yet.'
          : `${Object.values(health).filter((value) => value !== null).length}/4 metrics recorded.`,
      },
      {
        title: 'Journal',
        message: entries.length === 0 ? 'No entries captured yet.' : `${entries.length} journal ${entries.length === 1 ? 'entry' : 'entries'} saved.`,
      },
      {
        title: 'Streaks',
        message: totalHabits === 0 ? 'No habits tracked yet.' : `${completedToday}/${totalHabits} habits done today.`,
      },
    ],
    [completedCount, completedToday, entries.length, health, items.length, totalHabits],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Overview</p>
        <div className="mt-4 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-white">What matters today</h2>
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            Your dashboard surfaces the most important things for the day so you can stay calm and intentional.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Daily rhythm</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">A calm snapshot of your day</h3>
              </div>
              <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
                Today
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{dailyPrompt}</p>
            <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
              {weeklySnapshot.prompt}
            </div>
            <div className="mt-3 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
              <p className="font-semibold text-white">{monthlyReview.headline}</p>
              <p className="mt-2 leading-6 text-zinc-400">{monthlyReview.body}</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {statusHighlights.map((item) => (
                <div key={item.title} className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{item.message}</p>
                </div>
              ))}
            </div>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard
              title="Today’s Focus"
              description={focusSummary}
              badge={`${completedCount}/${items.length} complete`}
              to="/focus"
              actionLabel="Review"
            />
            <DashboardCard
              title="Health Snapshot"
                description={healthSummary}
              to="/health"
              actionLabel="Open"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard
              title="Journal"
                description={journalSummary}
              to="/journal"
              actionLabel="Write"
            />
            <DashboardCard
              title="Streaks"
              description={streakSummary}
              to="/streaks"
              actionLabel="View"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard
              title="Savings"
              description={savingsSummary}
              to="/savings"
              actionLabel="Track"
            />
            <DashboardCard
              title="Goals"
              description={goals.length === 0 ? 'No goals yet. Add one small promise.' : `${completedGoalsCount}/${goals.length} goals complete`}
              to="/goals"
              actionLabel="Review"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCard
              title="Notes"
              description={notes.length === 0 ? 'Capture a thought before it slips away.' : `${notes.length} personal notes saved`}
              to="/notes"
              actionLabel="Open"
            />
          </div>

          <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Monthly review</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">A calm look at how the month is unfolding</h3>
              </div>
              <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
                {new Date().toLocaleDateString(undefined, { month: 'long' })}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Keep a simple record of what was meaningful, what moved forward, and what deserves attention next.
            </p>
            <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
              <p className="font-semibold text-white">{monthlyReview.headline}</p>
              <p className="mt-2 leading-6 text-zinc-400">{monthlyReview.body}</p>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            {healthCards.map((item) => (
              <SectionCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <SectionCard
            title="Guiding question"
            description="What is the single most important thing you can do today? Keep that at the center of your decisions."
          />
          <SectionCard
            title="Next action"
            description="Use the focus page to add or complete up to three key tasks for the day."
          />
        </aside>
      </div>
    </div>
  );
}
