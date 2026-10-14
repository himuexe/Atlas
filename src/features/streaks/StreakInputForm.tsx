import { FormEvent, useState } from 'react';

interface StreakInputFormProps {
  onCreate: (name: string, restDays: number[]) => void;
}

const weekdays = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export function StreakInputForm({ onCreate }: StreakInputFormProps) {
  const [name, setName] = useState('');
  const [restDays, setRestDays] = useState<number[]>([]);

  const toggleRestDay = (day: number) => {
    setRestDays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : current.length < 6 ? [...current, day] : current);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    onCreate(name, restDays);
    setName('');
    setRestDays([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">New habit</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Habit name"
          required
          placeholder="Name a habit to track"
          className="w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-zinc-300">Optional rest days</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {weekdays.map((day) => {
            const selected = restDays.includes(day.value);
            return (
              <label key={day.value} className={`cursor-pointer rounded-2xl border px-2 py-2 text-center text-xs font-medium transition-colors focus-within:ring-2 focus-within:ring-white/40 ${selected ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 bg-white/[0.03] text-zinc-400'} ${!selected && restDays.length >= 6 ? 'cursor-not-allowed opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={!selected && restDays.length >= 6}
                  onChange={() => toggleRestDay(day.value)}
                  className="sr-only"
                />
                {day.label}
              </label>
            );
          })}
        </div>
        <p className="text-xs leading-5 text-zinc-500">Scheduled rest days are skipped when calculating streaks. Select at most six days so one day remains scheduled.</p>
      </fieldset>
      <button
        type="submit"
        className="inline-flex items-center rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-black"
      >
        Add habit
      </button>
    </form>
  );
}
