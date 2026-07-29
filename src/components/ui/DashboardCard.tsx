import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  description: string;
  to: string;
  badge?: string;
  actionLabel?: string;
}

export function DashboardCard({ title, description, to, badge, actionLabel = 'View' }: DashboardCardProps) {
  return (
    <article className="group rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-sm shadow-black/20 transition hover:border-cyan-400/30 hover:bg-slate-900/95">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">{title}</p>
          <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        {badge ? <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">{badge}</span> : null}
      </div>
      <Link
        to={to}
        className="mt-6 inline-flex items-center rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
      >
        {actionLabel}
      </Link>
    </article>
  );
}
