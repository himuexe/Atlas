import { SectionCard } from '../components/ui/SectionCard';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Dashboard</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">What matters today</h2>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Today's Focus" description="Review your top priorities for the day." />
        <SectionCard title="Health Snapshot" description="A quick overview of your current health metrics." />
        <SectionCard title="Journal" description="Capture your thoughts, wins, and reflections." />
        <SectionCard title="Streaks" description="Track your consistency in building healthy routines." />
      </div>
    </div>
  );
}
