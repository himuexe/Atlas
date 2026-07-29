import { SectionCard } from '../components/ui/SectionCard';

export function HealthPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Health Snapshot</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">See your wellbeing at a glance</h2>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Weight" description="Track your weight trend and progress." />
        <SectionCard title="Water" description="Keep a simple summary of your daily hydration." />
        <SectionCard title="Sleep" description="Reflect on your rest and recovery." />
      </div>
    </div>
  );
}
