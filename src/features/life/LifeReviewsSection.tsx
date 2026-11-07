import { useEffect, useState, type FormEvent } from 'react';
import { createLifeId } from './LifeFields';
import type { LifeReflection } from './domain/types';
import { deleteLifeReflection, loadLifeReflections, saveLifeReflection } from './persistence/lifeRepository';

const fieldClassName = 'mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20';
const actionClassName = 'rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-xs font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60 disabled:opacity-60';
type ReviewPeriod = LifeReflection['periodType'];

const reviewPeriods: Array<{ value: ReviewPeriod; label: string }> = [
  { value: 'weekly', label: 'Weekly review' },
  { value: 'monthly', label: 'Monthly review' },
  { value: 'annual', label: 'Annual review' },
  { value: 'multi-year', label: 'Multi-year review' },
];

function periodLabel(period: ReviewPeriod): string {
  return reviewPeriods.find((item) => item.value === period)?.label ??
    `${period[0]?.toUpperCase() ?? ''}${period.slice(1)} reflection`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', ...(value.includes('T') ? { timeStyle: 'short' as const } : {}) }).format(date);
}

function periodRange(review: LifeReflection): string {
  return review.periodEnd ? `${review.periodStart} to ${review.periodEnd}` : review.periodStart;
}

export function LifeReviewsSection() {
  const [reviews, setReviews] = useState<LifeReflection[]>([]);
  const [selected, setSelected] = useState<LifeReflection | null>(null);
  const [periodType, setPeriodType] = useState<ReviewPeriod>('weekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [content, setContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    setIsLoading(true);
    setError('');
    try {
      setReviews(await loadLifeReflections());
    } catch (loadError) {
      console.error('Failed to load Life reviews', loadError);
      setError('Life reviews could not be loaded from local storage.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const startNew = () => {
    setSelected(null);
    setPeriodType('weekly');
    setPeriodStart('');
    setPeriodEnd('');
    setContent('');
    setError('');
  };

  const edit = (review: LifeReflection) => {
    setSelected(review);
    setPeriodType(review.periodType);
    setPeriodStart(review.periodStart);
    setPeriodEnd(review.periodEnd ?? '');
    setContent(review.content);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (!periodStart || !periodEnd) throw new Error('Choose the start and end dates for the period.');
      if (periodEnd < periodStart) throw new Error('The review period end cannot be before its start.');
      if (periodType === 'multi-year' && Number(periodEnd.slice(0, 4)) - Number(periodStart.slice(0, 4)) < 2) {
        throw new Error('Choose a period spanning at least two calendar years for a multi-year review.');
      }
      const now = new Date().toISOString();
      await saveLifeReflection({
        id: selected?.id ?? createLifeId('life-review'),
        periodType,
        periodStart,
        periodEnd,
        content,
        createdAt: selected?.createdAt ?? now,
        modifiedAt: now,
      });
      await reload();
      startNew();
    } catch (saveError) {
      console.error('Failed to save Life review', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The review could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    setError('');
    setIsSaving(true);
    try {
      await deleteLifeReflection(id);
      setDeleteId(null);
      if (selected?.id === id) startNew();
      await reload();
    } catch (deleteError) {
      console.error('Failed to delete Life review', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'The review could not be deleted.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="life-reviews" aria-labelledby="life-reviews-heading" className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-200/60">Life history</p>
          <h3 id="life-reviews-heading" className="mt-2 text-xl font-semibold text-white">Periodic reflections</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Write a review only when it feels useful. These are your words and chosen periods—not scores, comparisons, or generated advice.
          </p>
        </div>
        {!selected ? <button type="button" onClick={startNew} className={actionClassName}>New review</button> : null}
      </header>

      {error ? <p id="life-review-error" role="alert" className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[0.04] p-3 text-sm text-rose-200">{error}</p> : null}

      <form onSubmit={submit} className="mt-5 grid gap-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4">
        <h4 className="font-medium text-zinc-100">{selected ? 'Edit your review' : 'Write a review'}</h4>
        <label className="block text-sm font-medium text-zinc-200" htmlFor="life-review-type">
          Review period
          <select id="life-review-type" aria-describedby={error ? 'life-review-error' : undefined} value={periodType} onChange={(event) => setPeriodType(event.target.value as ReviewPeriod)} className={fieldClassName}>
            {reviewPeriods.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            {selected && !reviewPeriods.some((item) => item.value === selected.periodType) ? (
              <option value={selected.periodType}>{periodLabel(selected.periodType)} (existing)</option>
            ) : null}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-200" htmlFor="life-review-start">
            Period start
            <input id="life-review-start" type="date" required aria-describedby={error ? 'life-review-error' : undefined} value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className={fieldClassName} />
          </label>
          <label className="block text-sm font-medium text-zinc-200" htmlFor="life-review-end">
            Period end
            <input id="life-review-end" type="date" required aria-describedby={error ? 'life-review-error' : undefined} value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className={fieldClassName} />
          </label>
        </div>
        <label className="block text-sm font-medium text-zinc-200" htmlFor="life-review-content">
          Your reflection
          <textarea id="life-review-content" required maxLength={10000} rows={6} aria-describedby={error ? 'life-review-error' : undefined} value={content} onChange={(event) => setContent(event.target.value)} className={`${fieldClassName} resize-y leading-6`} />
        </label>
        {selected ? <p className="text-xs text-zinc-500">Created {formatDate(selected.createdAt)} · Last edited {formatDate(selected.modifiedAt ?? selected.createdAt)}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={isSaving} className="rounded-full bg-purple-200 px-4 py-2.5 text-xs font-semibold text-[#160e20] disabled:opacity-60">
            {isSaving ? 'Saving…' : selected ? 'Save changes' : 'Save review'}
          </button>
          {selected ? <button type="button" disabled={isSaving} onClick={startNew} className={actionClassName}>Cancel editing</button> : null}
        </div>
      </form>

      <div className="mt-6 border-t border-white/[0.07] pt-5">
        <h4 className="text-sm font-semibold text-zinc-200">Saved reviews</h4>
        {isLoading ? <p role="status" className="mt-3 text-sm text-zinc-500">Loading reviews…</p> : null}
        {!isLoading && !reviews.length ? <p className="mt-3 text-sm text-zinc-500">No periodic reflections yet. This space is optional.</p> : null}
        <ol className="mt-3 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-white/[0.06] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h5 className="text-sm font-medium text-zinc-100">{periodLabel(review.periodType)} · {periodRange(review)}</h5>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{review.content}</p>
                  <p className="mt-2 text-xs text-zinc-500">Created {formatDate(review.createdAt)} · Last edited {formatDate(review.modifiedAt ?? review.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" aria-label={`Edit ${periodLabel(review.periodType).toLowerCase()} · ${periodRange(review)}`} onClick={() => edit(review)} className={actionClassName}>Edit</button>
                  {deleteId === review.id ? (
                    <>
                      <button type="button" aria-label={`Confirm delete ${periodLabel(review.periodType).toLowerCase()} · ${periodRange(review)}`} disabled={isSaving} onClick={() => void remove(review.id)} className="rounded-full border border-rose-300/20 px-3 py-2 text-xs text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200/60">Confirm delete</button>
                      <button type="button" aria-label={`Keep ${periodLabel(review.periodType).toLowerCase()} · ${periodRange(review)}`} onClick={() => setDeleteId(null)} className={actionClassName}>Keep</button>
                    </>
                  ) : (
                    <button type="button" aria-label={`Delete ${periodLabel(review.periodType).toLowerCase()} · ${periodRange(review)}`} onClick={() => setDeleteId(review.id)} className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Delete</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
