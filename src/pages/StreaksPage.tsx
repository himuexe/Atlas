import { SectionCard } from '../components/ui/SectionCard';

export function StreaksPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Streaks</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Track your consistency</h2>
      </header>

      <SectionCard title="Current streaks" description="Monitor your progress on meaningful habits over time." />
    </div>
  );
}
