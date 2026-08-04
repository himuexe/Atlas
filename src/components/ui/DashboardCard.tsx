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
    <article className="surface group flex min-h-[210px] flex-col rounded-2xl p-5 transition hover:border-white/20 hover:bg-white/[0.045]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{title}</p>
          <p className="mt-4 text-sm leading-6 text-zinc-400">{description}</p>
        </div>
        {badge ? <span className="shrink-0 rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium tracking-wide text-zinc-400">{badge}</span> : null}
      </div>
      <Link
        to={to}
        className="primary-button mt-auto w-fit pt-2.5"
      >
        {actionLabel}
      </Link>
    </article>
  );
}
