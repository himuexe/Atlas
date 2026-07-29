import { SectionCard } from '../../components/ui/SectionCard';

const focusItems = [
  { title: 'Priority 1', description: 'Finalize the dashboard layout and confirm the dark mode theme.' },
  { title: 'Priority 2', description: 'Sketch the data flow for Today’s Focus and health summary.' },
  { title: 'Priority 3', description: 'Keep the interface calm and simple for the first release.' },
];

const healthCards = [
  { title: 'Sleep', description: 'Rest and recovery are the foundation of a calm day.' },
  { title: 'Water', description: 'Stay hydrated with a simple daily habit.' },
  { title: 'Movement', description: 'Capture your current workout or activity status.' },
];

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Overview</p>
        <div className="mt-4 space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight text-white">What matters today</h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            Your dashboard brings together the focus, health, journal, and streaks that matter most. Start with a small set of meaningful actions.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-sm shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Today’s Focus</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Top priorities</h3>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                3 items
              </span>
            </div>
            <div className="mt-6 space-y-4">
              {focusItems.map((item) => (
                <div key={item.title} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {healthCards.map((item) => (
              <SectionCard key={item.title} title={item.title} description={item.description} />
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <SectionCard
            title="Journal prompt"
            description="Reflect on one win and one lesson from today. Keep entries short and meaningful."
          />
          <SectionCard
            title="Streak progress"
            description="Track consistency with one habit at a time, without overcomplicating your routine."
          />
        </aside>
      </div>
    </div>
  );
}
