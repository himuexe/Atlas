import { StreakInputForm } from './StreakInputForm';
import { StreakHabitCard } from './StreakHabitCard';
import { useStreaksContext } from './StreakContext';

export function StreaksFeature() {
  const { habits, addHabit, toggleToday, removeHabit, totalHabits, completedToday, bestStreak } = useStreaksContext();

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">🔥 Streaks</p>
        <h2 className="page-title mt-4">Track your consistency.</h2>
        <p className="page-copy mt-4">
          Build momentum with a few habits. Mark them complete each day to keep your streak going.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Total habits</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{totalHabits}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-400">Completed today</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{completedToday}</p>
                {totalHabits > 0 && (
                  <div className="mt-3 h-1 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Best streak</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{bestStreak}</p>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {habits.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
                Choose a habit you want to build. Start with something small and meaningful.
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
