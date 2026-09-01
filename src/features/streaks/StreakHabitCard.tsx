import { StreakHabit } from './types';

interface StreakHabitCardProps {
  habit: StreakHabit & { currentStreak: number; bestStreak: number; completedToday: boolean };
  onToggleToday: (id: string) => void;
  onRemove: (id: string) => void;
}

function getLast7Days(history: string[]): (boolean | null)[] {
  const historySet = new Set(history);
  const days: (boolean | null)[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push(historySet.has(dateKey) ? true : false);
  }
  
  return days;
}

export function StreakHabitCard({ habit, onToggleToday, onRemove }: StreakHabitCardProps) {
  const last7Days = getLast7Days(habit.history);
  
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#060606]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
          
          {/* Visual streak chain - last 7 days */}
          <div className="mt-3 flex gap-1.5">
            {last7Days.map((completed, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  completed
                    ? 'bg-white'
                    : 'bg-white/20'
                }`}
                title={`Day ${index - 6 + 7}`}
              />
            ))}
          </div>
          
          {/* Streak display */}
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Current</p>
              <p className="mt-1 text-2xl font-semibold text-white">{habit.currentStreak}</p>
              <p className="text-[10px] text-zinc-500">day{habit.currentStreak !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Best</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-300">{habit.bestStreak}</p>
              <p className="text-[10px] text-zinc-500">day{habit.bestStreak !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => onToggleToday(habit.id)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
              habit.completedToday
                ? 'bg-white text-black hover:bg-zinc-100'
                : 'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
            }`}
          >
            {habit.completedToday ? '✓ Done' : 'Mark done'}
          </button>
          <button
            type="button"
            onClick={() => onRemove(habit.id)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-400 hover:bg-white/10 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
