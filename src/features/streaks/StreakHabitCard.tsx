import { StreakHabit } from './types';

interface StreakHabitCardProps {
  habit: StreakHabit & { currentStreak: number; bestStreak: number; completedToday: boolean };
  onToggleToday: (id: string) => void;
  onRemove: (id: string) => void;
}

export function StreakHabitCard({ habit, onToggleToday, onRemove }: StreakHabitCardProps) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#060606]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Current streak: {habit.currentStreak} days</p>
          <p className="text-sm leading-6 text-zinc-400">Best streak: {habit.bestStreak} days</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => onToggleToday(habit.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${habit.completedToday ? 'bg-white text-black' : 'border border-white/10 bg-white/5 text-zinc-200'}`}
          >
            {habit.completedToday ? 'Done today' : 'Mark done'}
          </button>
          <button
            type="button"
            onClick={() => onRemove(habit.id)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-400"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
