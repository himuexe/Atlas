import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { SectionCard } from '../../components/ui/SectionCard';
import { exportDatabase, importDatabase, clearCheckIns, clearXPEvents, clearMilestones } from '../../lib/persistence/sqlite';
import { useFocus } from '../focus/FocusContext';
import { useHealth } from '../health/HealthContext';
import { useJournalContext } from '../journal/JournalContext';
import { useSettingsContext } from './SettingsContext';
import { useStreaksContext } from '../streaks/StreakContext';
import { useSavingsContext } from '../savings/SavingsContext';
import { useGoalsContext } from '../goals/GoalsContext';
import { useNotesContext } from '../notes/NotesContext';
import { useGamificationContext } from '../gamification/GamificationContext';

const startupOptions = [
  { label: 'Dashboard', value: '/dashboard' as const },
  { label: "Today's Focus", value: '/focus' as const },
  { label: 'Health Snapshot', value: '/health' as const },
  { label: 'Journal', value: '/journal' as const },
  { label: 'Streaks', value: '/streaks' as const },
  { label: 'Savings', value: '/savings' as const },
  { label: 'Goals', value: '/goals' as const },
  { label: 'Notes', value: '/notes' as const },
  { label: 'Settings', value: '/settings' as const },
];

export function SettingsFeature() {
  const { startupPage, setStartupPage, reset: resetSettings } = useSettingsContext();
  const { items, reset: resetFocus } = useFocus();
  const { health, reset: resetHealth } = useHealth();
  const { entries, reset: resetJournal } = useJournalContext();
  const { habits, reset: resetStreaks } = useStreaksContext();
  const { entries: savingsEntries, reset: resetSavings } = useSavingsContext();
  const { goals, reset: resetGoals } = useGoalsContext();
  const { notes, reset: resetNotes } = useNotesContext();
  const { level, currentCheckInStreak, allCheckIns } = useGamificationContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const selectedPageLabel = useMemo(
    () => startupOptions.find((option) => option.value === startupPage)?.label ?? 'Dashboard',
    [startupPage],
  );

  const filledHealthMetrics = Object.values(health).filter((value) => value !== null).length;

  const resetAllData = () => {
    const confirmed = window.confirm(
      'Resetting app data will clear every entry, note, goal, habit, preference, level, XP, check-in, and saved progress. This cannot be undone.',
    );
    if (!confirmed) {
      return;
    }

    resetFocus();
    resetHealth();
    resetJournal();
    resetStreaks();
    resetSavings();
    resetGoals();
    resetNotes();
    resetSettings();
    
    // Reset gamification data
    void Promise.all([clearCheckIns(), clearXPEvents(), clearMilestones()]).catch((err) => 
      console.error('Failed to reset gamification data', err)
    );
    
    setStatusMessage('All local data has been cleared.');
  };

  const handleExportData = async () => {
    try {
      setStatusMessage('Preparing backup export...');
      const buffer = await exportDatabase();
      const blob = new Blob([buffer], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atlas-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
      link.click();
      window.URL.revokeObjectURL(url);
      setStatusMessage('Backup exported successfully.');
    } catch (error) {
      console.error('Failed to export Atlas backup', error);
      setStatusMessage('Could not export backup. Please try again.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setIsImporting(true);
      setStatusMessage('Importing backup...');
      const buffer = await file.arrayBuffer();
      await importDatabase(buffer);
      setStatusMessage('Backup imported successfully. Reloading Atlas...');
      window.setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (error) {
      console.error('Failed to import Atlas backup', error);
      setStatusMessage('Could not import backup. Please choose a valid Atlas backup file.');
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">⚙️ Settings</p>
        <h2 className="page-title mt-4">Customize how Atlas opens and manages your data.</h2>
        <p className="page-copy mt-4">
          Settings let you control where the app opens first and reset your current progress when you want a fresh start.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Preferences</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Start Atlas where it helps you most</h3>
            </div>
            <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
              Current: {selectedPageLabel}
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-zinc-200">
              Startup page
              <select
                value={startupPage}
                onChange={(event) => setStartupPage(event.target.value as typeof startupPage)}
                className="mt-3 w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
              >
                {startupOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-black text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Your preferred startup page is stored locally so Atlas opens where you want it to each time.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Data management</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Keep your workspace clean</h3>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            If you'd like to start over, reset every local entry, preference, and saved progress.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Focus items</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{items.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Health metrics</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{filledHealthMetrics} / 4</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Journal entries</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{entries.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Streaks</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{habits.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Savings entries</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{savingsEntries.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Goals</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{goals.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Notes</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{notes.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Check-ins</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{allCheckIns.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Current streak</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">🔥 {currentCheckInStreak}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Atlas level</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{level.level}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="flex-1 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100"
              >
                Export backup
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex-1 rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isImporting ? 'Importing...' : 'Import backup'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite,.db,application/octet-stream"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={resetAllData}
              className="w-full rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Reset all app data
            </button>
          </div>

          {statusMessage ? (
            <p className="mt-4 text-sm text-zinc-400">{statusMessage}</p>
          ) : null}
        </section>
      </div>

      <SectionCard
        title="About this version"
        description="Atlas stores your entries and startup preference locally. Export a backup before resetting or moving to a new browser."
      />
    </div>
  );
}
