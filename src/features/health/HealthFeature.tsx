import { HealthMetricCard } from './HealthMetricCard';
import { useHealth } from './HealthContext';

const metricDefinitions = [
  { key: 'weight' as const, label: 'Weight', unit: 'kg', placeholder: 'e.g. 72' },
  { key: 'water' as const, label: 'Water', unit: 'glasses', placeholder: 'e.g. 8' },
  { key: 'sleep' as const, label: 'Sleep', unit: 'hours', placeholder: 'e.g. 7.5' },
  { key: 'workout' as const, label: 'Workout', unit: 'minutes', placeholder: 'e.g. 30' },
];

export function HealthFeature() {
  const { health, updateMetric, filledMetricsCount, lastUpdated } = useHealth();

  return (
    <div className="space-y-6">
      <header className="border-b border-white/10 pb-8">
        <p className="eyebrow">Health Snapshot</p>
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
                Updated {lastUpdated}
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              A consistent habit of logging these core metrics helps you see small changes before they become big trends.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            {metricDefinitions.map((metric) => (
              <HealthMetricCard
                key={metric.key}
                label={metric.label}
                value={health[metric.key]}
                unit={metric.unit}
                placeholder={metric.placeholder}
                onUpdate={(value) => updateMetric(metric.key, value)}
              />
            ))}
          </div>
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
