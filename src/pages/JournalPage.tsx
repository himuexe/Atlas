import { SectionCard } from '../components/ui/SectionCard';

export function JournalPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Journal</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Capture your daily reflections</h2>
      </header>

      <SectionCard title="Daily entry" description="Write a short reflection about today’s wins, lessons, and intentions." />
    </div>
  );
}
