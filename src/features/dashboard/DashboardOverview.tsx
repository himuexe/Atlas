import { useMemo } from 'react';
import { DashboardCard } from '../../components/ui/DashboardCard';
import { SectionCard } from '../../components/ui/SectionCard';
import { useFocus } from '../focus/FocusContext';
import { useHealth } from '../health/HealthContext';

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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Overview</p>
        <div className="mt-4 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-white">What matters today</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Your dashboard surfaces the most important things for the day so you can stay calm and intentional.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
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
              description="Capture a quick reflection or review your recent thoughts."
              to="/journal"
              actionLabel="Write"
            />
            <DashboardCard
              title="Streaks"
              description="Check your consistency and keep momentum going without distraction."
              to="/streaks"
              actionLabel="View"
            />
          </div>

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
