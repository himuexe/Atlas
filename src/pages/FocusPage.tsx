import { SectionCard } from '../components/ui/SectionCard';

export function FocusPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Today's Focus</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Focus on your top 3 priorities</h2>
      </header>

      <SectionCard
        title="Your focus list"
        description="Capture the three most important tasks for today and mark them as complete as you progress."
      />
    </div>
  );
}
