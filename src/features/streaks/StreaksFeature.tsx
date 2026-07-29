import { StreakInputForm } from './StreakInputForm';
import { StreakHabitCard } from './StreakHabitCard';
import { useStreaksContext } from './StreakContext';

export function StreaksFeature() {
  const { habits, addHabit, toggleToday, removeHabit, totalHabits, completedToday, bestStreak } = useStreaksContext();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Streaks</p>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Track your consistency</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-400">
          Build momentum with a few habits. Mark them complete each day to keep your streak going.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-slate-950/95 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Habits</p>
                <p className="mt-2 text-3xl font-semibold text-white">{totalHabits}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/95 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Completed today</p>
                <p className="mt-2 text-3xl font-semibold text-white">{completedToday}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/95 p-4">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Best streak</p>
                <p className="mt-2 text-3xl font-semibold text-white">{bestStreak}</p>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-sm text-slate-400">
                Add a habit to start building streaks. The app will track completion for today.
              </div>
            ) : (
              <div className="space-y-4">
                {habits.map((habit) => (
                  <StreakHabitCard
                    key={habit.id}
                    habit={habit}
                    onToggleToday={toggleToday}
                    onRemove={removeHabit}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <StreakInputForm onCreate={addHabit} />
      </div>
    </div>
  );
}
