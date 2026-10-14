import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface HealthMetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  placeholder: string;
  onUpdate: (value: number | null) => void;
  valueLabel?: string;
  controls?: ReactNode;
  inputMin?: number;
  inputStep?: number | 'any';
}

export function HealthMetricCard({
  label,
  value,
  unit,
  placeholder,
  onUpdate,
  valueLabel,
  controls,
  inputMin,
  inputStep,
}: HealthMetricCardProps) {
  const reducedMotion = useReducedMotion();
  const displayValue = valueLabel ?? (value !== null ? `${value} ${unit}` : '—');

  return (
    <div className="health-metric-card rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">{label}</p>
          <motion.p
            key={displayValue}
            initial={reducedMotion !== false ? false : { opacity: 0.72, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedMotion !== false ? { duration: 0.01 } : { duration: 0.16, ease: [0.2, 0, 0, 1] }}
            className="health-metric-value mt-3 text-3xl font-semibold tracking-tight text-white"
          >
            {displayValue}
          </motion.p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
          {label}
        </span>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const rawValue = formData.get('value')?.toString().trim();
          if (!rawValue) {
            onUpdate(null);
            return;
          }

          const numericValue = Number(rawValue);
          if (!Number.isFinite(numericValue) || (inputMin !== undefined && numericValue < inputMin)) {
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
            min={inputMin}
            step={inputStep ?? 'any'}
            placeholder={placeholder}
            className="min-w-0 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          <button
            type="submit"
            className="rounded-3xl bg-white px-4 py-3 text-sm font-semibold text-black"
          >
            Save
          </button>
        </div>
      </form>
      {controls}
    </div>
  );
}
