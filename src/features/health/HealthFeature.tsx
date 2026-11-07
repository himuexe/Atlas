import { HealthMetricCard } from './HealthMetricCard';
import { useHealth } from './HealthContext';

const metricDefinitions = [
  { key: 'weight' as const, label: 'Weight', unit: 'kg', placeholder: 'e.g. 72' },
  { key: 'water' as const, label: 'Water', unit: 'bottles', placeholder: 'e.g. 2' },
  { key: 'sleep' as const, label: 'Sleep', unit: 'hours', placeholder: 'e.g. 7.5' },
  { key: 'workout' as const, label: 'Workout', unit: 'minutes', placeholder: 'e.g. 30' },
];

export function HealthFeature() {
  const { health, updateMetric, filledMetricsCount, lastUpdated, history, saveError } = useHealth();
  const latestRecorded = new Date(lastUpdated);
  const lastUpdatedLabel = lastUpdated === 'No updates yet' || lastUpdated.includes('unknown') || Number.isNaN(latestRecorded.getTime())
    ? lastUpdated
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(latestRecorded);

  return (
    <div className="health-feature space-y-6">
      <header className="feature-heading border-b border-white/10 pb-8">
        <p className="eyebrow">❤️ Health Snapshot</p>
        <h2 className="page-title mt-4">See your wellbeing at a glance.</h2>
        <p className="page-copy mt-4">
          Track your core health metrics for today. This snapshot helps you stay aware without adding noise.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Snapshot</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{filledMetricsCount} of 4 metrics recorded</h3>
              </div>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">
                Latest entry {lastUpdatedLabel}
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              A consistent habit of logging these core metrics helps you see small changes before they become big trends.
            </p>
          </section>
          {saveError ? <p role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-4 text-sm text-rose-200">{saveError}</p> : null}

          <div className="grid gap-6 lg:grid-cols-2">
            {metricDefinitions.map((metric) => (
              <HealthMetricCard
                key={metric.key}
                label={metric.label}
                value={health[metric.key]}
                unit={metric.unit}
                placeholder={metric.placeholder}
                valueLabel={metric.key === 'water' && health.water !== null
                  ? `${health.water} bottles (${Number((health.water * 0.75).toFixed(2))} L)`
                  : undefined}
                inputMin={metric.key === 'water' ? 0 : undefined}
                inputStep={metric.key === 'water' ? 1 : 'any'}
                controls={metric.key === 'water' ? (
                  <div className="mt-4 flex items-center gap-3" aria-label="Water bottle controls">
                    <button
                      type="button"
                      onClick={() => updateMetric('water', Math.max(0, (health.water ?? 0) - 1))}
                      disabled={health.water === null || health.water <= 0}
                      aria-label="Decrease water by one bottle"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="text-sm text-zinc-400">750 ml per bottle</span>
                    <button
                      type="button"
                      onClick={() => updateMetric('water', (health.water ?? 0) + 1)}
                      aria-label="Increase water by one bottle"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-lg font-semibold text-white"
                    >
                      +
                    </button>
                  </div>
                ) : undefined}
                onUpdate={(value) => updateMetric(metric.key, value)}
              />
            ))}
          </div>
          <details className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
            <summary className="cursor-pointer text-sm font-medium text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200/60">
              Health entry history ({history.length})
            </summary>
            {history.length ? (
              <ol className="mt-4 space-y-3">
                {[...history].sort((left, right) =>
                  (right.observedAt ?? '').localeCompare(left.observedAt ?? '') ||
                  right.enteredAt.localeCompare(left.enteredAt) ||
                  right.id.localeCompare(left.id),
                ).map((entry) => (
                  <li key={entry.id} className="rounded-xl border border-white/[0.06] p-3">
                    <p className="text-sm text-zinc-200">{entry.metric}: {entry.value === null ? 'Cleared' : entry.value}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {entry.observedAt
                        ? `Observed ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.observedAt))}`
                        : 'Imported existing value · measurement date unknown'}
                      {' · '}Entered {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.enteredAt))}
                    </p>
                  </li>
                ))}
              </ol>
            ) : <p className="mt-3 text-sm text-zinc-500">Health changes you record will appear here. Existing values without a measurement date are labeled as undated baselines.</p>}
          </details>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Why it matters</p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">A simple health snapshot</h3>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              This page focuses on a few meaningful health metrics. It is intentionally compact to keep the experience calm and easy to update.
            </p>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">Guidance</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
              <li>Keep entries simple and consistent.</li>
              <li>Use weight once per day or when it feels relevant.</li>
              <li>Record sleep and hydration as part of your morning routine.</li>
              <li>Capture a short workout summary rather than every step.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
