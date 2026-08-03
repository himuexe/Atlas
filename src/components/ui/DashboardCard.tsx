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
    <article className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500">{title}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
        </div>
        {badge ? <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-300">{badge}</span> : null}
      </div>
      <Link
        to={to}
        className="mt-6 inline-flex items-center rounded-2xl border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-black"
      >
        {actionLabel}
      </Link>
    </article>
  );
}
