import { useState } from 'react';
import { StreakHabit } from './types';
import { getLastSevenDayStatuses } from './utils';

interface StreakHabitCardProps {
  habit: StreakHabit & { currentStreak: number; bestStreak: number; completedToday: boolean; todayIsRestDay: boolean };
  onToggleToday: (id: string) => void;
  onUpdateRestDays: (id: string, restDays: number[]) => void;
  onRemove: (id: string) => void;
}

const weekdays = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export function StreakHabitCard({ habit, onToggleToday, onUpdateRestDays, onRemove }: StreakHabitCardProps) {
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [draftRestDays, setDraftRestDays] = useState(habit.restDays);
  const last7Days = getLastSevenDayStatuses(habit.history, habit.restDays);

  const toggleRestDay = (day: number) => {
    setDraftRestDays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : current.length < 6 ? [...current, day] : current);
  };

  const cancelScheduleEdit = () => {
    setDraftRestDays(habit.restDays);
    setIsEditingSchedule(false);
  };

  const saveSchedule = () => {
    onUpdateRestDays(habit.id, draftRestDays);
    setIsEditingSchedule(false);
  };
  
  return (
    <article className="rounded-[22px] border border-white/10 bg-[#060606]/90 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-white">{habit.name}</h3>
          
          <ol aria-label={`Last seven days for ${habit.name}`} className="mt-5 grid grid-cols-7 gap-2">
            {last7Days.map(({ date, weekday, status }) => {
              const colors = {
                completed: 'border-white/40 bg-white text-black',
                incomplete: 'border-white/10 bg-white/[0.03] text-zinc-400',
                rest: 'border-dashed border-white/20 bg-transparent text-zinc-500',
              };
              const statusText = status === 'completed' ? 'Completed' : status === 'rest' ? 'Rest day' : 'Incomplete';
              return (
                <li key={date} aria-label={`${weekday}, ${date}: ${statusText}`} className={`min-w-0 list-none rounded-xl border px-1 py-2 text-center ${colors[status]}`}>
                  <span className="block text-[10px] font-semibold uppercase tracking-wide">{weekday}</span>
                  <span className="mt-1 block text-[10px]" aria-hidden="true">
                    {status === 'completed' ? '✓' : status === 'rest' ? '—' : '·'}
                  </span>
                </li>
              );
            })}
          </ol>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500" aria-label="Weekly status legend">
            <li><span className="mr-1 text-white" aria-hidden="true">✓</span>Completed</li>
            <li><span className="mr-1 text-zinc-500" aria-hidden="true">·</span>Incomplete</li>
            <li><span className="mr-1 text-zinc-500" aria-hidden="true">—</span>Scheduled rest</li>
          </ul>

          {isEditingSchedule ? (
            <fieldset className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <legend className="px-1 text-xs font-medium text-zinc-300">Planned rest days</legend>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => {
                  const selected = draftRestDays.includes(day.value);
                  return (
                    <label key={day.value} className={`cursor-pointer rounded-xl border px-3 py-2 text-xs focus-within:ring-2 focus-within:ring-white/40 ${selected ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-zinc-400'} ${!selected && draftRestDays.length >= 6 ? 'cursor-not-allowed opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!selected && draftRestDays.length >= 6}
                        onChange={() => toggleRestDay(day.value)}
                        className="sr-only"
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs leading-5 text-zinc-500">Select up to six days so one day remains scheduled.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={cancelScheduleEdit} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-300">Cancel</button>
                <button type="button" onClick={saveSchedule} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">Save schedule</button>
              </div>
            </fieldset>
          ) : (
            <button
              type="button"
              onClick={() => { setDraftRestDays(habit.restDays); setIsEditingSchedule(true); }}
              className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white"
            >
              {habit.restDays.length ? `Rest days: ${weekdays.filter((day) => habit.restDays.includes(day.value)).map((day) => day.label.slice(0, 3)).join(', ')}` : 'Set rest days'}
            </button>
          )}
          
          {/* Streak display */}
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Current</p>
              <p className="mt-1 text-2xl font-semibold text-white">{habit.currentStreak}</p>
              <p className="text-[10px] text-zinc-500">scheduled day{habit.currentStreak !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Best</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-300">{habit.bestStreak}</p>
              <p className="text-[10px] text-zinc-500">scheduled day{habit.bestStreak !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={() => onToggleToday(habit.id)}
            disabled={habit.todayIsRestDay}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-colors ${
              habit.completedToday
                ? 'bg-white text-black hover:bg-signal-hover'
                : 'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
            }`}
          >
            {habit.todayIsRestDay ? 'Rest day' : habit.completedToday ? '✓ Done' : 'Mark done'}
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
