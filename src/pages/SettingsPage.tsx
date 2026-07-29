import { SectionCard } from '../components/ui/SectionCard';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Settings</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Customize Atlas</h2>
      </header>

      <SectionCard title="Preferences" description="Manage theme, display preferences, and data options." />
    </div>
  );
}
