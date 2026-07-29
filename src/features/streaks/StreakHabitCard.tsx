import { StreakHabit } from './types';

interface StreakHabitCardProps {
  habit: StreakHabit & { currentStreak: number; bestStreak: number; completedToday: boolean };
  onToggleToday: (id: string) => void;
  onRemove: (id: string) => void;
}

export function StreakHabitCard({ habit, onToggleToday, onRemove }: StreakHabitCardProps) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Current streak: {habit.currentStreak} days</p>
          <p className="text-sm leading-6 text-slate-400">Best streak: {habit.bestStreak} days</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => onToggleToday(habit.id)}
            className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${habit.completedToday ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}
          >
            {habit.completedToday ? 'Done today' : 'Mark done'}
          </button>
          <button
            type="button"
            onClick={() => onRemove(habit.id)}
            className="rounded-3xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
