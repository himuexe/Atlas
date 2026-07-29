import { useMemo } from 'react';
import { SectionCard } from '../../components/ui/SectionCard';
import { useFocus } from '../focus/FocusContext';
import { useHealth } from '../health/HealthContext';
import { useJournalContext } from '../journal/JournalContext';
import { useSettingsContext } from './SettingsContext';
import { useStreaksContext } from '../streaks/StreakContext';

const startupOptions = [
  { label: 'Dashboard', value: '/dashboard' as const },
  { label: "Today's Focus", value: '/focus' as const },
  { label: 'Health Snapshot', value: '/health' as const },
  { label: 'Journal', value: '/journal' as const },
  { label: 'Streaks', value: '/streaks' as const },
  { label: 'Settings', value: '/settings' as const },
];

export function SettingsFeature() {
  const { startupPage, setStartupPage } = useSettingsContext();
  const { items, reset: resetFocus } = useFocus();
  const { health, reset: resetHealth } = useHealth();
  const { entries, reset: resetJournal } = useJournalContext();
  const { habits, reset: resetStreaks } = useStreaksContext();

  const selectedPageLabel = useMemo(
    () => startupOptions.find((option) => option.value === startupPage)?.label ?? 'Dashboard',
    [startupPage],
  );

  const filledHealthMetrics = Object.values(health).filter((value) => value !== null).length;

  const resetAllData = () => {
    const confirmed = window.confirm(
      'Resetting app data will clear progress from focus, health, journal, and streaks. This cannot be undone.',
    );
    if (!confirmed) {
      return;
    }

    resetFocus();
    resetHealth();
    resetJournal();
    resetStreaks();
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Settings</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Customize how Atlas opens and manages your data</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Settings let you control where the app opens first and reset your current progress when you want a fresh start.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Preferences</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Start Atlas where it helps you most</h3>
            </div>
            <span className="rounded-3xl bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
              Current: {selectedPageLabel}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-200">
              Startup page
              <select
                value={startupPage}
                onChange={(event) => setStartupPage(event.target.value as typeof startupPage)}
                className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
              >
                {startupOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-950 text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-4 text-sm leading-6 text-slate-400">
            Your preferred startup page is stored locally so Atlas opens where you want it to each time.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Data management</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Keep your workspace clean</h3>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            If you'd like to start over, reset all current entries and progress. This clears focus items, health metrics, journal entries, and streaks.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Focus items</p>
              <p className="mt-2 text-2xl font-semibold text-white">{items.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Health metrics</p>
              <p className="mt-2 text-2xl font-semibold text-white">{filledHealthMetrics} / 4</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Journal entries</p>
              <p className="mt-2 text-2xl font-semibold text-white">{entries.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Streaks</p>
              <p className="mt-2 text-2xl font-semibold text-white">{habits.length}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAllData}
            className="mt-6 w-full rounded-3xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30"
          >
            Reset all app data
          </button>
        </section>
      </div>

      <SectionCard
        title="About this version"
        description="Settings in V1 are designed to remain lightweight. Future updates will expand personalization and persistent storage across all modules."
      />
    </div>
  );
}
