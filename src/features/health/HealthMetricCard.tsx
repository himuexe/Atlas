import { HealthMetricKey } from './types';

interface HealthMetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  placeholder: string;
  onUpdate: (value: number | null) => void;
}

const metricColors: Record<HealthMetricKey, string> = {
  weight: 'from-cyan-400 to-slate-900',
  water: 'from-cyan-400 to-slate-900',
  sleep: 'from-slate-500 to-slate-900',
  workout: 'from-slate-700 to-slate-900',
};

export function HealthMetricCard({ label, value, unit, placeholder, onUpdate }: HealthMetricCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value !== null ? `${value} ${unit}` : '—'}</p>
        </div>
        <span className={`inline-flex rounded-full bg-gradient-to-r ${metricColors[label.toLowerCase() as HealthMetricKey]} bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white`}>
          {label}
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const rawValue = formData.get('value')?.toString().trim();
          const numericValue = rawValue ? Number(rawValue) : null;
          if (!rawValue || Number.isNaN(numericValue)) {
            onUpdate(null);
            return;
          }
          onUpdate(numericValue);
        }}
        className="mt-6 space-y-3"
      >
        <label className="sr-only" htmlFor={`${label}-input`}>{`Update ${label}`}</label>
        <div className="flex gap-3">
          <input
            id={`${label}-input`}
            name="value"
            type="number"
            step="any"
            placeholder={placeholder}
            className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="submit"
            className="rounded-3xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
