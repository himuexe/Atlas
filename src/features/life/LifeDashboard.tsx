import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { calculateAge, type LifeDashboardDimension, type LifeDashboardSnapshot } from './domain/dashboard';
import { useLifeContext } from './LifeContext';
import { loadLifeDashboardSnapshot } from './persistence/lifeRepository';
import { useHealth } from '../health/HealthContext';
import { useJournalContext } from '../journal/JournalContext';
import { useSavingsContext } from '../savings/SavingsContext';

const currentSelfFields = [
  ['physicalCondition', 'Physical condition & lifestyle'],
  ['careerSituation', 'Career & professional situation'],
  ['financialCircumstances', 'Financial circumstances'],
  ['knowledgeCapabilities', 'Knowledge & capabilities'],
  ['relationshipsSocialLife', 'Relationships & social life'],
  ['habitsCharacter', 'Personal habits & character'],
  ['currentChallenges', 'Current challenges'],
  ['currentStrengths', 'Current strengths'],
] as const;

function formatDate(value: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function displayValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return value === null || value === undefined ? '' : JSON.stringify(value);
}

function displayObservation(entry: NonNullable<LifeDashboardDimension['attributes'][number]['currentEntry']>, definition: LifeDashboardDimension['attributes'][number]['definition']): string {
  const raw = displayValue(entry.value);
  return definition.financialType ? `${entry.currency ?? ''} ${raw}`.trim() : `${raw}${definition.unit ? ` ${definition.unit}` : ''}`;
}

function displayTarget(target: NonNullable<LifeDashboardDimension['attributes'][number]['currentTarget']>, definition: LifeDashboardDimension['attributes'][number]['definition']): string {
  const raw = displayValue(target.targetValue);
  return definition.financialType
    ? `${target.currency ?? ''} ${raw}`.trim()
    : `${raw}${definition.unit ? ` ${definition.unit}` : ''}`;
}

function observationLabel(entry: NonNullable<LifeDashboardDimension['attributes'][number]['currentEntry']>, definition: LifeDashboardDimension['attributes'][number]['definition']): string {
  if (definition.financialType === 'income') {
    return `User-reported income · ${entry.scope} · ${entry.currency} · ${entry.reportingPeriodStart} to ${entry.reportingPeriodEnd}`;
  }
  if (definition.financialType === 'net-worth') return `User-reported net worth · ${entry.currency}`;
  return 'Latest valid observation';
}

function attributeState(dimension: LifeDashboardDimension): string {
  const activeAttributes = dimension.attributes.filter(({ definition }) => definition.isActive);
  if (!dimension.dimension.isActive) return `Inactive dimension · ${dimension.attributes.length} configured attributes`;
  if (dimension.attributes.length === 0) return 'No attributes configured';
  if (!activeAttributes.length) return `${dimension.attributes.length} inactive attributes`;
  const observations = activeAttributes.filter(({ currentEntry }) => currentEntry !== null).length;
  const configured = `${activeAttributes.length} active attribute${activeAttributes.length === 1 ? '' : 's'}`;
  const inactive = dimension.attributes.length - activeAttributes.length;
  const inactiveLabel = inactive ? ` · ${inactive} inactive` : '';
  return observations
    ? `${configured}${inactiveLabel} · ${observations} current observation${observations === 1 ? '' : 's'}`
    : `${configured}${inactiveLabel} · no observations yet`;
}

function DimensionCard({
  item,
  onExplore,
}: {
  item: LifeDashboardDimension;
  onExplore: (id: string) => void;
}) {
  const { dimension, attributes } = item;
  return (
    <details className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] open:border-purple-200/20">
      <summary className="cursor-pointer list-none p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200/60 sm:p-5">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-100">{dimension.name}</span>
              {!dimension.isBuiltIn ? (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-400">Custom</span>
              ) : null}
              {!dimension.isActive ? (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-zinc-500">Inactive</span>
              ) : null}
            </span>
            <span className="mt-1.5 block text-sm leading-5 text-zinc-400">{dimension.description}</span>
            <span className="mt-2 block text-xs text-purple-100/70">{attributeState(item)}</span>
          </span>
          <span aria-hidden="true" className="pt-1 text-zinc-500 transition-transform group-open:rotate-90 motion-reduce:transition-none">›</span>
        </span>
      </summary>
      <div className="space-y-3 border-t border-white/[0.06] px-4 py-4 sm:px-5">
        {attributes.length ? (
          <ul className="space-y-3">
            {attributes.map(({ definition, currentEntry, currentTarget }) => (
              <li key={definition.id} className="rounded-xl border border-white/[0.06] bg-black/20 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="text-sm font-medium text-zinc-200">{definition.name}</h5>
                  {!definition.isActive ? <span className="text-[10px] uppercase tracking-wider text-zinc-500">Inactive</span> : null}
                </div>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <p className="text-zinc-400">
                    <span className="text-zinc-500">{currentEntry ? observationLabel(currentEntry, definition) : 'Latest valid observation'}: </span>
                    {currentEntry
                      ? <>{displayObservation(currentEntry, definition)} <span className="text-xs text-zinc-500">· effective {formatDate(currentEntry.recordedAt)} · entered {formatDate(currentEntry.createdAt)}</span></>
                      : 'Not recorded'}
                  </p>
                  <p className="text-zinc-400">
                    <span className="text-zinc-500">Current target: </span>
                    {currentTarget
                      ? <>{currentTarget.targetValue !== undefined
                        ? displayTarget(currentTarget, definition)
                        : currentTarget.narrative || 'Target recorded'} <span className="text-xs text-zinc-500">· {formatDate(currentTarget.createdAt)}</span></>
                      : 'Not set'}
                  </p>
                </div>
                {currentTarget?.scope ? <p className="mt-1 text-xs text-zinc-500">Target scope: {currentTarget.scope}</p> : null}
                {currentTarget?.reportingPeriodStart && currentTarget.reportingPeriodEnd ? (
                  <p className="mt-1 text-xs text-zinc-500">Target reporting period: {currentTarget.reportingPeriodStart} to {currentTarget.reportingPeriodEnd}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">There are no attributes configured for this dimension. It remains optional.</p>
        )}
        <button
          type="button"
          onClick={() => onExplore(dimension.id)}
          className="rounded-full border border-purple-200/15 px-3.5 py-2 text-xs font-medium text-purple-100 hover:bg-purple-200/[0.08] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
        >
          Explore dimension
        </button>
      </div>
    </details>
  );
}

function DimensionGroup({
  title,
  dimensions,
  onExplore,
}: {
  title: string;
  dimensions: LifeDashboardDimension[];
  onExplore: (id: string) => void;
}) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-zinc-300">{title}</h4>
      {dimensions.length ? (
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {dimensions.map((item) => <DimensionCard key={item.dimension.id} item={item} onExplore={onExplore} />)}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
          No custom dimensions have been added.
        </p>
      )}
    </div>
  );
}

export function LifeDashboard({
  onExploreDimension,
  refreshSignal,
}: {
  onExploreDimension: (id: string) => void;
  refreshSignal: number;
}) {
  const { profile, currentSelf, idealSelf, personalValues, dimensions, attributes } = useLifeContext();
  const { health: healthState, lastUpdated: healthLastUpdated } = useHealth();
  const { entries: savingsEntries } = useSavingsContext();
  const { entries: journalEntries } = useJournalContext();
  const [snapshot, setSnapshot] = useState<LifeDashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadId, setReloadId] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    void loadLifeDashboardSnapshot()
      .then((result) => { if (active) setSnapshot(result); })
      .catch((loadError: unknown) => {
        console.error('Failed to load Life dashboard snapshot', loadError);
        if (active) setError('The Life overview could not be loaded from local storage.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [
    reloadId,
    refreshSignal,
    profile,
    currentSelf,
    idealSelf,
    personalValues,
    dimensions,
    attributes,
    healthState,
    healthLastUpdated,
    savingsEntries,
    journalEntries,
  ]);

  if (isLoading && !snapshot) {
    return (
      <section aria-labelledby="life-dashboard-heading" className="surface rounded-[26px] border border-purple-300/10 bg-[#09070f]/85 p-5 sm:p-7">
        <h3 id="life-dashboard-heading" className="text-xl font-semibold text-white">Your life, in view</h3>
        <p role="status" className="mt-3 text-sm text-zinc-400">Gathering your saved context…</p>
      </section>
    );
  }
  if (!snapshot) {
    return (
      <section aria-labelledby="life-dashboard-heading" className="surface rounded-[26px] border border-purple-300/10 bg-[#09070f]/85 p-5 sm:p-7">
        <h3 id="life-dashboard-heading" className="text-xl font-semibold text-white">Your life, in view</h3>
        <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p>
        <button type="button" onClick={() => setReloadId((value) => value + 1)} className="mt-4 rounded-full border border-purple-200/20 px-4 py-2 text-sm text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">
          Try again
        </button>
      </section>
    );
  }

  const age = calculateAge(snapshot.profile?.dateOfBirth, new Date());
  const currentSelfContent = currentSelfFields.flatMap(([key, label]) => {
    const value = snapshot.currentSelf?.[key];
    return value?.trim() ? [{ label, value }] : [];
  });
  const healthLabels = [
    ['weight', 'Weight', 'kg'],
    ['water', 'Water', 'bottles'],
    ['sleep', 'Sleep', 'hours'],
    ['workout', 'Workout', 'minutes'],
  ] as const;
  const health = snapshot.healthSnapshot?.health;
  const hasHealthValues = Boolean(health && Object.values(health).some((value) => value !== null));

  return (
    <section aria-labelledby="life-dashboard-heading" className="surface overflow-hidden rounded-[26px] border border-purple-300/10 bg-[#09070f]/85 p-5 shadow-[0_20px_80px_rgba(27,10,47,0.18)] sm:p-7">
      <header className="border-b border-white/[0.07] pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-200/65">Life overview</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h3 id="life-dashboard-heading" className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {snapshot.profile?.name?.trim() ? `Your life, ${snapshot.profile.name.trim()}` : 'Your life, in view'}
          </h3>
          <button type="button" onClick={() => setReloadId((value) => value + 1)} disabled={isLoading} className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-purple-200/60 disabled:opacity-50">
            {isLoading ? 'Refreshing…' : 'Refresh overview'}
          </button>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          A quiet overview of what you have chosen to record. Unrecorded areas are simply unknown here—not a judgment.
        </p>
        {error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : null}
      </header>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <article id="life-dashboard-profile" className="rounded-2xl border border-purple-200/10 bg-gradient-to-br from-purple-300/[0.07] to-transparent p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-semibold text-white">Personal overview</h4>
            <a href="#life-profile" className="text-xs text-purple-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">Edit profile</a>
          </div>
          <dl className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
            {([
              ['Age', age === null ? null : `${age}`],
              ['Occupation', snapshot.profile?.occupation],
              ['Education', snapshot.profile?.education],
              ['Current life phase', snapshot.profile?.lifePhase],
            ] as const).map(([label, value]) => value !== null && value !== undefined && value !== '' ? (
              <div key={label}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">{label}</dt>
                <dd className="mt-1 text-sm text-zinc-200">{value}{label === 'Age' ? ' years' : ''}</dd>
              </div>
            ) : null)}
          </dl>
          {snapshot.profile?.description ? (
            <div className="mt-4 border-t border-white/[0.07] pt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Personal description</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{snapshot.profile.description}</p>
            </div>
          ) : null}
          {!snapshot.profile?.name && age === null && !snapshot.profile?.occupation && !snapshot.profile?.education && !snapshot.profile?.lifePhase && !snapshot.profile?.description ? (
            <p className="mt-4 text-sm leading-6 text-zinc-400">Add only the personal context that feels useful to you.</p>
          ) : null}
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <article id="life-dashboard-current-self" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-white">Current Self</h4>
              <a href="#life-current-self" className="text-xs text-purple-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">Edit reflection</a>
            </div>
            {currentSelfContent.length ? (
              <div className="mt-3 space-y-3">
                {currentSelfContent.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">{label}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{value}</p>
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-sm leading-6 text-zinc-400">Your present circumstances can be described in your own words, whenever it feels useful.</p>}
          </article>
          <article id="life-dashboard-ideal-self" className="rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-white">Ideal Self</h4>
              <a href="#life-ideal-self" className="text-xs text-purple-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">Edit vision</a>
            </div>
            {snapshot.idealSelf ? (
              <>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{snapshot.idealSelf.narrative}</p>
                <p className="mt-3 text-xs text-zinc-500">Last reflected on {formatDate(snapshot.idealSelf.createdAt)}</p>
              </>
            ) : <p className="mt-3 text-sm leading-6 text-zinc-400">Your vision may include ambitions, ordinary joys, and what you hope to protect.</p>}
          </article>
        </div>
      </div>

      <section id="life-dashboard-dimensions" aria-labelledby="life-dashboard-dimensions-heading" className="mt-5 rounded-2xl border border-white/[0.07] bg-black/15 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-200/60">A whole-life framework</p>
            <h4 id="life-dashboard-dimensions-heading" className="mt-1 text-lg font-semibold text-white">Life dimensions</h4>
          </div>
          <a href="#life-dimensions" className="text-xs text-purple-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">Open dimension explorer</a>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Open an area to see its latest valid observations and current targets separately. No score or progress judgment is calculated.</p>
        <DimensionGroup title="Canonical dimensions" dimensions={snapshot.canonicalDimensions} onExplore={onExploreDimension} />
        <DimensionGroup title="Your custom dimensions" dimensions={snapshot.customDimensions} onExplore={onExploreDimension} />
      </section>

      <section aria-labelledby="life-dashboard-snapshots-heading" className="mt-5">
        <h4 id="life-dashboard-snapshots-heading" className="text-lg font-semibold text-white">A few current signals</h4>
        <p className="mt-1 text-sm text-zinc-400">Read-only snapshots from the features that hold these records.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="font-medium text-zinc-100">Health Snapshot</h5>
                <p className="mt-1 text-xs text-zinc-500">Current snapshot, not historical trends</p>
              </div>
              <Link to="/health" className="text-xs text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Open</Link>
            </div>
            {hasHealthValues ? (
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {healthLabels.map(([key, label, unit]) => {
                  const value = health?.[key];
                  if (value === null || value === undefined) return null;
                  const observation = snapshot.healthSnapshot?.metrics[key][0];
                  return (
                    <div key={key}>
                      <dt className="text-xs text-zinc-500">{label}</dt>
                      <dd className="text-sm text-zinc-200">{value} {unit}{key === 'water' ? ` (${Number((value * 0.75).toFixed(2))} L)` : ''}</dd>
                      <dd className="text-[10px] text-zinc-500">
                        {observation?.observedAt
                          ? `Observed ${formatDate(observation.observedAt)}`
                          : 'Existing value · measurement date unknown'}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : <p className="mt-3 text-sm text-zinc-500">No health values recorded.</p>}
            {snapshot.healthSnapshot ? <p className="mt-3 text-xs text-zinc-500">Each metric retains its own entry date; imported baseline dates are unknown.</p> : null}
          </article>
          <article className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="font-medium text-zinc-100">Savings</h5>
                <p className="mt-1 text-xs text-zinc-500">Across all recorded ledger entries · not net worth</p>
              </div>
              <Link to="/savings" className="text-xs text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Open</Link>
            </div>
            {snapshot.savings.entryCount ? (
              <p className="mt-3 text-xl font-semibold tabular-nums text-zinc-100">₹{snapshot.savings.ledgerBalance.toFixed(2)}</p>
            ) : <p className="mt-3 text-sm text-zinc-500">No savings ledger entries recorded.</p>}
            <p className="mt-1 text-xs text-zinc-500">{snapshot.savings.entryCount} recorded {snapshot.savings.entryCount === 1 ? 'entry' : 'entries'}</p>
          </article>
          <article className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="font-medium text-zinc-100">Journal</h5>
                <p className="mt-1 text-xs text-zinc-500">Private text stays in your journal</p>
              </div>
              <Link to="/journal" className="text-xs text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Open</Link>
            </div>
            <p className="mt-3 text-sm text-zinc-300">{snapshot.journal.entryCount} recorded {snapshot.journal.entryCount === 1 ? 'reflection' : 'reflections'}</p>
            <p className="mt-1 text-xs text-zinc-500">Most recent: {formatDate(snapshot.journal.latestEntryAt)}</p>
          </article>
        </div>
      </section>

      <section aria-labelledby="life-dashboard-identity-heading" className="mt-5 rounded-2xl border border-purple-200/10 bg-gradient-to-r from-purple-200/[0.035] to-transparent p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-purple-200/60">Identity & character</p>
            <h4 id="life-dashboard-identity-heading" className="mt-1 text-lg font-semibold text-white">What matters, and how you hope to live</h4>
          </div>
          <div className="flex gap-4 text-xs">
            <a href="#life-values" className="text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Personal values</a>
            <a href="#life-personality-character" className="text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Character reflections</a>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h5 className="text-sm font-medium text-zinc-200">Personal Values</h5>
            {snapshot.personalValues.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {snapshot.personalValues.map((value) => <li key={value.id} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-300">{value.name}</li>)}
              </ul>
            ) : <p className="mt-1 text-sm text-zinc-500">No personal values recorded.</p>}
          </div>
          <div>
            <h5 className="text-sm font-medium text-zinc-200">Personality & Character</h5>
            {snapshot.reflectedTraits.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {snapshot.reflectedTraits.map((trait) => <li key={trait.id} className="rounded-full border border-purple-200/15 bg-purple-200/[0.045] px-3 py-1.5 text-xs text-purple-100">{trait.name}</li>)}
              </ul>
            ) : <p className="mt-1 text-sm text-zinc-500">No trait reflections recorded.</p>}
            <p className="mt-2 text-xs text-zinc-500">These are separate, user-authored reflections—not a ranking or assessment.</p>
          </div>
        </div>
      </section>
      <p className="mt-4 text-xs leading-5 text-zinc-500">All areas are optional. The overview reflects what is recorded and makes no claim about areas you have not chosen to track.</p>
    </section>
  );
}
