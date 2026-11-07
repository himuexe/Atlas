import { useEffect, useState, type FormEvent } from 'react';
import {
  isLifePriority,
  lifePriorities,
  type AttributeDefinition,
  type AttributeEntry,
  type AttributeValueType,
  type IdealTargetRevision,
  type LifePriority,
} from './domain/types';
import { createLifeId } from './LifeFields';
import {
  correctLifeAttributeEntry,
  invalidateLifeAttributeEntry,
  loadLifeAttributeDetail,
  recordLifeAttributeEntry,
  saveLifeAttributeTarget,
  type LifeAttributeDetailSnapshot,
} from './persistence/lifeRepository';

const fieldClassName = 'mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20';
const actionClassName = 'rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-xs font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60 disabled:cursor-wait disabled:opacity-60';

type EntryEditorState = { mode: 'new' } | { mode: 'correction'; original: AttributeEntry };

function localDateTimeValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function displayValue(value: unknown, attribute: AttributeDefinition): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return `${value}${attribute.unit ? ` ${attribute.unit}` : ''}`;
  if (typeof value === 'string') return value;
  return String(value);
}

function displayEntryValue(entry: AttributeEntry, attribute: AttributeDefinition): string {
  const value = displayValue(entry.value, attribute);
  return attribute.financialType && entry.currency ? `${entry.currency} ${value}` : value;
}

function displayTargetValue(target: IdealTargetRevision, attribute: AttributeDefinition): string {
  const value = displayValue(target.targetValue, attribute);
  return attribute.financialType && target.currency ? `${target.currency} ${value}` : value;
}

function valueLabel(valueType: AttributeValueType): string {
  switch (valueType) {
    case 'frequency': return 'Frequency';
    case 'counter': return 'Count';
    case 'rating': return 'Rating';
    case 'boolean': return 'State';
    case 'milestone': return 'Milestone';
    case 'numeric': return 'Value';
    case 'narrative': return 'Assessment';
  }
}

function definitionTypeLabel(attribute: AttributeDefinition): string {
  const kind = attribute.kind === 'subjective-assessment'
    ? 'Subjective assessment'
    : attribute.kind === 'capability'
      ? 'Capability'
      : 'Measurement';
  return `${kind} · ${valueLabel(attribute.valueType)}`;
}

function ValueField({
  valueType,
  value,
  onChange,
  id,
  unit,
}: {
  valueType: AttributeValueType;
  value: string;
  onChange: (value: string) => void;
  id: string;
  unit?: string;
}) {
  if (valueType === 'narrative' || valueType === 'milestone') {
    return (
      <label className="block text-sm font-medium text-zinc-200" htmlFor={id}>
        {valueLabel(valueType)}
        <textarea
          id={id}
          required
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldClassName} resize-y leading-6`}
        />
      </label>
    );
  }
  if (valueType === 'boolean') {
    return (
      <label className="block text-sm font-medium text-zinc-200" htmlFor={id}>
        {valueLabel(valueType)}
        <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName}>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </label>
    );
  }
  return (
    <label className="block text-sm font-medium text-zinc-200" htmlFor={id}>
      {valueLabel(valueType)}{unit ? ` (${unit})` : ''}{valueType === 'rating' ? ' (no fixed scale)' : ''}
      <input
        id={id}
        type="number"
        required
        step="any"
        min={valueType === 'counter' || valueType === 'frequency' ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      />
      {valueType === 'counter' || valueType === 'frequency' ? (
        <span className="mt-1 block text-xs font-normal text-zinc-500">
          Enter a non-negative value{valueType === 'frequency' ? ' for the period you choose in the notes' : ''}.
        </span>
      ) : null}
    </label>
  );
}

function parseValue(valueType: AttributeValueType, value: string): unknown {
  if (valueType === 'boolean') return value === 'true';
  if (valueType === 'numeric' || valueType === 'rating' || valueType === 'counter' || valueType === 'frequency') {
    if (!value.trim()) throw new Error('Enter a value.');
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error('Enter a valid number.');
    if ((valueType === 'counter' || valueType === 'frequency') && number < 0) {
      throw new Error('Enter a non-negative value.');
    }
    return number;
  }
  if (!value.trim()) throw new Error('Enter an assessment.');
  return value.trim();
}

function TargetForm({
  attribute,
  onCancel,
  onSaved,
}: {
  attribute: AttributeDefinition;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(attribute.valueType === 'boolean' ? 'true' : '');
  const [narrative, setNarrative] = useState('');
  const [reason, setReason] = useState('');
  const [successDefinition, setSuccessDefinition] = useState('');
  const [priority, setPriority] = useState<LifePriority>(attribute.priority);
  const [currency, setCurrency] = useState('');
  const [incomeScope, setIncomeScope] = useState('');
  const [reportingPeriodStart, setReportingPeriodStart] = useState('');
  const [reportingPeriodEnd, setReportingPeriodEnd] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const targetValue = attribute.valueType === 'narrative'
        ? undefined
        : parseValue(attribute.valueType, value);
      if (attribute.valueType === 'narrative' && !narrative.trim()) {
        throw new Error('Describe the desired state.');
      }
      await saveLifeAttributeTarget({
        id: createLifeId('life-target'),
        attributeId: attribute.id,
        targetValue,
        currency: attribute.financialType && targetValue !== undefined ? currency.trim().toUpperCase() : undefined,
        scope: attribute.financialType === 'income' && targetValue !== undefined ? incomeScope.trim() : undefined,
        reportingPeriodStart: attribute.financialType === 'income' && targetValue !== undefined ? reportingPeriodStart : undefined,
        reportingPeriodEnd: attribute.financialType === 'income' && targetValue !== undefined ? reportingPeriodEnd : undefined,
        narrative: attribute.valueType === 'narrative' ? narrative.trim() : narrative.trim() || undefined,
        reason: reason.trim() || undefined,
        successDefinition: successDefinition.trim() || undefined,
        priority,
        createdAt: new Date().toISOString(),
      });
      await onSaved();
      onCancel();
    } catch (saveError) {
      console.error('Failed to save Life attribute target', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The target could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4">
      {attribute.valueType !== 'narrative' ? (
        <ValueField valueType={attribute.valueType} value={value} onChange={setValue} id="life-target-value" unit={attribute.unit} />
      ) : null}
      {attribute.financialType && attribute.valueType !== 'narrative' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-currency">
            Currency code
            <input id="life-target-currency" required maxLength={3} minLength={3} autoCapitalize="characters" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="e.g. INR" className={fieldClassName} />
          </label>
          {attribute.financialType === 'income' ? (
            <>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-income-scope">
                Income scope
                <input id="life-target-income-scope" required maxLength={120} value={incomeScope} onChange={(event) => setIncomeScope(event.target.value)} placeholder="e.g. gross salary" className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-period-start">
                Reporting period start
                <input id="life-target-period-start" required type="date" value={reportingPeriodStart} onChange={(event) => setReportingPeriodStart(event.target.value)} className={fieldClassName} />
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-period-end">
                Reporting period end
                <input id="life-target-period-end" required type="date" value={reportingPeriodEnd} onChange={(event) => setReportingPeriodEnd(event.target.value)} className={fieldClassName} />
              </label>
            </>
          ) : null}
        </div>
      ) : null}
      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-narrative">
        {attribute.valueType === 'narrative' ? 'Desired state' : 'Desired state or context (optional)'}
        <textarea
          id="life-target-narrative"
          required={attribute.valueType === 'narrative'}
          rows={3}
          value={narrative}
          onChange={(event) => setNarrative(event.target.value)}
          className={`${fieldClassName} resize-y leading-6`}
          placeholder="Describe what you hope this could look or feel like."
        />
      </label>
      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-reason">
        Why this matters (optional)
        <textarea id="life-target-reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} className={`${fieldClassName} resize-y leading-6`} />
      </label>
      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-success">
        What success means to you (optional)
        <textarea id="life-target-success" rows={2} value={successDefinition} onChange={(event) => setSuccessDefinition(event.target.value)} className={`${fieldClassName} resize-y leading-6`} />
      </label>
      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-target-priority">
        Priority
        <select
          id="life-target-priority"
          value={priority}
          onChange={(event) => { if (isLifePriority(event.target.value)) setPriority(event.target.value); }}
          className={fieldClassName}
        >
          {lifePriorities.map((item) => <option key={item} value={item}>{item === 'maintain' ? 'Maintain current state' : `${item[0].toUpperCase()}${item.slice(1)}`}</option>)}
        </select>
      </label>
      <p className="text-xs leading-5 text-zinc-500">Saving creates a new revision. Earlier versions remain in the history.</p>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving} className="rounded-full bg-purple-200 px-4 py-2.5 text-xs font-semibold text-[#160e20] disabled:opacity-60">
          {isSaving ? 'Saving…' : 'Save new target revision'}
        </button>
        <button type="button" disabled={isSaving} onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function LifeAttributeDetail({
  attribute,
  onBack,
  onDataChange,
}: {
  attribute: AttributeDefinition;
  onBack: () => void;
  onDataChange: () => void;
}) {
  const [snapshot, setSnapshot] = useState<LifeAttributeDetailSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editor, setEditor] = useState<EntryEditorState | null>(null);
  const [targetFormOpen, setTargetFormOpen] = useState(false);
  const [entryValue, setEntryValue] = useState(attribute.valueType === 'boolean' ? 'true' : '');
  const [recordedAt, setRecordedAt] = useState(() => localDateTimeValue(new Date()));
  const [entryNote, setEntryNote] = useState('');
  const [currency, setCurrency] = useState('');
  const [incomeScope, setIncomeScope] = useState('');
  const [reportingPeriodStart, setReportingPeriodStart] = useState('');
  const [reportingPeriodEnd, setReportingPeriodEnd] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [invalidationId, setInvalidationId] = useState<string | null>(null);
  const [invalidationReason, setInvalidationReason] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      setSnapshot(await loadLifeAttributeDetail(attribute.id));
    } catch (loadFailure) {
      console.error('Failed to load Life attribute history', loadFailure);
      setLoadError(loadFailure instanceof Error ? loadFailure.message : 'Attribute history could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetEntryEditor = () => {
    setEditor(null);
    setEntryValue(attribute.valueType === 'boolean' ? 'true' : '');
    setRecordedAt(localDateTimeValue(new Date()));
    setEntryNote('');
    setCurrency('');
    setIncomeScope('');
    setReportingPeriodStart('');
    setReportingPeriodEnd('');
    setCorrectionReason('');
  };

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setSnapshot(null);
    setLoadError('');
    void loadLifeAttributeDetail(attribute.id)
      .then((detail) => { if (active) setSnapshot(detail); })
      .catch((loadFailure: unknown) => {
        console.error('Failed to load Life attribute history', loadFailure);
        if (active) setLoadError(loadFailure instanceof Error ? loadFailure.message : 'Attribute history could not be loaded.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [attribute.id]);

  const submitEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      if (!recordedAt || Number.isNaN(new Date(recordedAt).getTime())) throw new Error('Choose a valid recorded date and time.');
      const entry: AttributeEntry = {
        id: createLifeId('life-entry'),
        attributeId: attribute.id,
        recordedAt: new Date(recordedAt).toISOString(),
        value: parseValue(attribute.valueType, entryValue),
        note: entryNote.trim() || undefined,
        currency: attribute.financialType ? currency.trim().toUpperCase() : undefined,
        scope: attribute.financialType === 'income' ? incomeScope.trim() : undefined,
        reportingPeriodStart: attribute.financialType === 'income' ? reportingPeriodStart : undefined,
        reportingPeriodEnd: attribute.financialType === 'income' ? reportingPeriodEnd : undefined,
        isValid: true,
        createdAt: new Date().toISOString(),
      };
      if (editor?.mode === 'correction') {
        if (!correctionReason.trim()) throw new Error('Explain why this entry is being corrected.');
        await correctLifeAttributeEntry(editor.original.id, entry, correctionReason);
      } else {
        await recordLifeAttributeEntry(entry);
      }
      await reload();
      onDataChange();
      resetEntryEditor();
    } catch (saveError) {
      console.error('Failed to save Life attribute entry', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The entry could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const invalidate = async (entryId: string) => {
    setError('');
    setIsSaving(true);
    try {
      await invalidateLifeAttributeEntry(entryId, new Date().toISOString(), invalidationReason);
      await reload();
      onDataChange();
      setInvalidationId(null);
      setInvalidationReason('');
    } catch (saveError) {
      console.error('Failed to invalidate Life attribute entry', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The entry could not be invalidated.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p role="status" className="mt-5 text-sm text-zinc-400">Loading attribute history…</p>;
  }
  if (loadError) {
    return (
      <div className="mt-5 rounded-2xl border border-rose-300/15 bg-rose-300/[0.04] p-4">
        <p role="alert" className="text-sm text-rose-200">{loadError}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void reload()} className={actionClassName}>Retry loading history</button>
          <button type="button" onClick={onBack} className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Back to dimension</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button type="button" onClick={onBack} className="rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">
        ← Back to dimension
      </button>
      <div className="mt-4 border-b border-white/[0.07] pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{attribute.name}</h4>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{attribute.description || 'No description provided.'}</p>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Definition type</dt>
                <dd className="mt-1 text-xs text-zinc-200">{definitionTypeLabel(attribute)}</dd>
              </div>
              {attribute.unit ? (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Unit</dt>
                  <dd className="mt-1 text-xs text-zinc-200">{attribute.unit}</dd>
                </div>
              ) : null}
              {attribute.measurementFrequency ? (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Suggested cadence</dt>
                  <dd className="mt-1 text-xs text-zinc-200">{attribute.measurementFrequency}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <span className="rounded-full border border-purple-200/20 bg-purple-200/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-purple-100">
            {attribute.isBuiltIn ? 'Built-in attribute' : 'Custom attribute'}
          </span>
        </div>
        {!attribute.isActive ? (
          <p className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.04] p-3 text-sm text-amber-100/80">
            This attribute is inactive. Its history and target remain available, but new records cannot be added.
          </p>
        ) : null}
      </div>

      {loadError ? <p role="alert" className="mt-4 text-sm text-rose-300">{loadError}</p> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p> : null}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <section aria-labelledby="life-current-entry-heading" className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-200/60">Current state</p>
          <h5 id="life-current-entry-heading" className="mt-2 text-lg font-semibold text-white">Latest valid entry</h5>
          {snapshot?.currentEntry ? (
            <div className="mt-3">
              <p className="break-words text-base leading-7 text-zinc-100">{displayEntryValue(snapshot.currentEntry, attribute)}</p>
              <p className="mt-2 text-xs text-zinc-400">Recorded {formatDateTime(snapshot.currentEntry.recordedAt)}</p>
              <p className="mt-1 text-xs text-zinc-500">Added {formatDateTime(snapshot.currentEntry.createdAt)}</p>
              {snapshot.currentEntry.scope ? <p className="mt-1 text-xs text-zinc-400">Scope: {snapshot.currentEntry.scope}</p> : null}
              {snapshot.currentEntry.reportingPeriodStart && snapshot.currentEntry.reportingPeriodEnd ? (
                <p className="mt-1 text-xs text-zinc-400">Reporting period: {snapshot.currentEntry.reportingPeriodStart} to {snapshot.currentEntry.reportingPeriodEnd}</p>
              ) : null}
              {snapshot.currentEntry.note ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{snapshot.currentEntry.note}</p> : null}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-zinc-500">No valid entries yet. You can start with one observation, or leave this attribute untracked.</p>
          )}
          {attribute.valueType === 'milestone' ? (
            <p className="mt-4 text-xs leading-5 text-zinc-500">Milestones are recorded separately as achievements, not as attribute observations.</p>
          ) : null}
          {attribute.isActive && attribute.valueType !== 'milestone' && !editor ? (
            <button type="button" onClick={() => setEditor({ mode: 'new' })} className={`${actionClassName} mt-4`}>Record a state</button>
          ) : null}
          {editor ? (
            <form onSubmit={submitEntry} className="mt-4 space-y-4 border-t border-white/[0.07] pt-4">
              <h6 className="font-medium text-zinc-100">{editor.mode === 'correction' ? 'Record a correction' : 'New observation'}</h6>
              <ValueField valueType={attribute.valueType} value={entryValue} onChange={setEntryValue} id="life-entry-value" unit={attribute.unit} />
              <label className="block text-sm font-medium text-zinc-200" htmlFor="life-entry-recorded-at">
                Effective / as-of date and time
                <input id="life-entry-recorded-at" type="datetime-local" required value={recordedAt} onChange={(event) => setRecordedAt(event.target.value)} className={fieldClassName} />
                <span className="mt-1 block text-xs font-normal text-zinc-500">This is when the observation applies. It may be backdated; the entered date is stored separately.</span>
              </label>
              {attribute.financialType ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-zinc-200" htmlFor="life-entry-currency">
                    Currency code
                    <input id="life-entry-currency" required maxLength={3} minLength={3} autoCapitalize="characters" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="e.g. INR" className={fieldClassName} />
                    <span className="mt-1 block text-xs font-normal text-zinc-500">Use an ISO-style three-letter code, such as INR, USD, or EUR.</span>
                  </label>
                  {attribute.financialType === 'income' ? (
                    <>
                      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-income-scope">
                        Income scope
                        <input id="life-income-scope" required maxLength={120} value={incomeScope} onChange={(event) => setIncomeScope(event.target.value)} placeholder="e.g. gross salary" className={fieldClassName} />
                      </label>
                      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-income-period-start">
                        Reporting period start
                        <input id="life-income-period-start" required type="date" value={reportingPeriodStart} onChange={(event) => setReportingPeriodStart(event.target.value)} className={fieldClassName} />
                      </label>
                      <label className="block text-sm font-medium text-zinc-200" htmlFor="life-income-period-end">
                        Reporting period end
                        <input id="life-income-period-end" required type="date" value={reportingPeriodEnd} onChange={(event) => setReportingPeriodEnd(event.target.value)} className={fieldClassName} />
                      </label>
                    </>
                  ) : null}
                </div>
              ) : null}
              <label className="block text-sm font-medium text-zinc-200" htmlFor="life-entry-note">
                Notes or context (optional)
                <textarea id="life-entry-note" rows={2} value={entryNote} onChange={(event) => setEntryNote(event.target.value)} className={`${fieldClassName} resize-y leading-6`} />
              </label>
              {editor.mode === 'correction' ? (
                <label className="block text-sm font-medium text-zinc-200" htmlFor="life-correction-reason">
                  Why is this a correction?
                  <textarea id="life-correction-reason" required rows={2} value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} className={`${fieldClassName} resize-y leading-6`} />
                </label>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={isSaving} className="rounded-full bg-purple-200 px-4 py-2.5 text-xs font-semibold text-[#160e20] disabled:opacity-60">
                  {isSaving ? 'Saving…' : editor.mode === 'correction' ? 'Save correction' : 'Save entry'}
                </button>
                <button type="button" disabled={isSaving} onClick={resetEntryEditor} className="rounded-full border border-white/10 px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Cancel</button>
              </div>
            </form>
          ) : null}
        </section>

        <section aria-labelledby="life-target-heading" className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-200/60">Ideal Self</p>
          <h5 id="life-target-heading" className="mt-2 text-lg font-semibold text-white">A direction you choose</h5>
          {snapshot?.currentTarget ? (
            <div className="mt-3">
              {snapshot.currentTarget.targetValue !== undefined ? (
                <>
                  <p className="text-base leading-7 text-zinc-100">{displayTargetValue(snapshot.currentTarget, attribute)}</p>
                  {snapshot.currentTarget.scope ? <p className="mt-1 text-xs text-zinc-400">Scope: {snapshot.currentTarget.scope}</p> : null}
                  {snapshot.currentTarget.reportingPeriodStart && snapshot.currentTarget.reportingPeriodEnd ? (
                    <p className="mt-1 text-xs text-zinc-400">Reporting period: {snapshot.currentTarget.reportingPeriodStart} to {snapshot.currentTarget.reportingPeriodEnd}</p>
                  ) : null}
                </>
              ) : null}
              {snapshot.currentTarget.narrative ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{snapshot.currentTarget.narrative}</p> : null}
              <p className="mt-3 text-xs text-zinc-400">
                Priority: {snapshot.currentTarget.priority === 'maintain' ? 'Maintain current state' : snapshot.currentTarget.priority}
              </p>
              {snapshot.currentTarget.reason ? <p className="mt-2 text-sm leading-6 text-zinc-400"><span className="text-zinc-300">Why it matters: </span>{snapshot.currentTarget.reason}</p> : null}
              {snapshot.currentTarget.successDefinition ? <p className="mt-2 text-sm leading-6 text-zinc-400"><span className="text-zinc-300">Success means: </span>{snapshot.currentTarget.successDefinition}</p> : null}
              <p className="mt-2 text-xs text-zinc-500">Revision saved {formatDateTime(snapshot.currentTarget.createdAt)}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-zinc-500">No target set. A desired state can be a number, a rating, or a few words about what matters to you.</p>
          )}
          {attribute.isActive && !targetFormOpen ? (
            <button type="button" onClick={() => setTargetFormOpen(true)} className={`${actionClassName} mt-4`}>
              {snapshot?.currentTarget ? 'Create a new target revision' : 'Define a desired state'}
            </button>
          ) : null}
          {targetFormOpen ? (
            <TargetForm
              attribute={attribute}
              onCancel={() => setTargetFormOpen(false)}
              onSaved={async () => {
                await reload();
                onDataChange();
              }}
            />
          ) : null}
          {snapshot?.targetHistory && snapshot.targetHistory.length > 1 ? (
            <details className="mt-4 border-t border-white/[0.07] pt-4">
              <summary className="cursor-pointer text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Previous target revisions ({snapshot.targetHistory.length - 1})</summary>
              <ol className="mt-3 space-y-3">
                {[...snapshot.targetHistory].reverse().slice(1).map((revision: IdealTargetRevision) => (
                  <li key={revision.id} className="rounded-xl border border-white/[0.06] p-3">
                    {revision.targetValue !== undefined ? <p className="break-words text-sm text-zinc-200">{displayTargetValue(revision, attribute)}</p> : null}
                    {revision.scope ? <p className="mt-1 text-xs text-zinc-400">Scope: {revision.scope}</p> : null}
                    {revision.reportingPeriodStart && revision.reportingPeriodEnd ? (
                      <p className="mt-1 text-xs text-zinc-400">Reporting period: {revision.reportingPeriodStart} to {revision.reportingPeriodEnd}</p>
                    ) : null}
                    {revision.narrative ? <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{revision.narrative}</p> : null}
                    <p className="mt-2 text-xs text-zinc-500">{formatDateTime(revision.createdAt)} · {revision.priority === 'maintain' ? 'Maintain current state' : revision.priority}</p>
                    {revision.reason ? <p className="mt-2 text-xs leading-5 text-zinc-500">Why: {revision.reason}</p> : null}
                    {revision.successDefinition ? <p className="mt-1 text-xs leading-5 text-zinc-500">Success: {revision.successDefinition}</p> : null}
                  </li>
                ))}
              </ol>
            </details>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="life-history-heading" className="mt-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-purple-200/60">History</p>
            <h5 id="life-history-heading" className="mt-2 text-lg font-semibold text-white">Past observations</h5>
          </div>
          <span className="text-xs text-zinc-500">{snapshot?.entries.length ?? 0} {snapshot?.entries.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        {snapshot?.entries.length ? (
          <ol className="mt-4 space-y-3">
            {[...snapshot.entries].reverse().map((entry) => (
              <li key={entry.id} className={`rounded-xl border p-4 ${entry.isValid ? 'border-white/[0.06]' : 'border-amber-200/10 bg-amber-200/[0.02]'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-zinc-100">{displayEntryValue(entry, attribute)}</p>
                    {entry.scope ? <p className="mt-1 text-xs text-zinc-400">Scope: {entry.scope}</p> : null}
                    {entry.reportingPeriodStart && entry.reportingPeriodEnd ? (
                      <p className="mt-1 text-xs text-zinc-400">Reporting period: {entry.reportingPeriodStart} to {entry.reportingPeriodEnd}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-zinc-400">Effective {formatDateTime(entry.recordedAt)}</p>
                    <p className="mt-1 text-xs text-zinc-500">Entered {formatDateTime(entry.createdAt)}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    entry.isValid ? 'border-emerald-200/15 bg-emerald-200/[0.04] text-emerald-100/80' : 'border-amber-200/15 bg-amber-200/[0.04] text-amber-100/80'
                  }`}>
                    {entry.isValid ? 'Valid' : 'Invalidated'}
                  </span>
                </div>
                {entry.note ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{entry.note}</p> : null}
                {entry.correctsEntryId ? <p className="mt-2 text-xs text-zinc-500">Corrects entry {entry.correctsEntryId}</p> : null}
                {entry.invalidatedAt ? <p className="mt-2 text-xs text-zinc-500">Invalidated {formatDateTime(entry.invalidatedAt)}{entry.invalidationReason ? ` · ${entry.invalidationReason}` : ''}</p> : null}
                {entry.isValid && attribute.isActive && attribute.valueType !== 'milestone' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditor({ mode: 'correction', original: entry });
                        setEntryValue(String(entry.value));
                        setRecordedAt(localDateTimeValue(new Date(entry.recordedAt)));
                        setEntryNote(entry.note ?? '');
                         setCurrency(entry.currency ?? '');
                         setIncomeScope(entry.scope ?? '');
                         setReportingPeriodStart(entry.reportingPeriodStart ?? '');
                         setReportingPeriodEnd(entry.reportingPeriodEnd ?? '');
                      }}
                      className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
                    >
                      Correct entry
                    </button>
                    {invalidationId === entry.id ? (
                      <form
                        className="flex w-full flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => { event.preventDefault(); void invalidate(entry.id); }}
                      >
                        <label className="sr-only" htmlFor={`invalidate-${entry.id}`}>Reason for invalidating this entry</label>
                        <input
                          id={`invalidate-${entry.id}`}
                          required
                          value={invalidationReason}
                          onChange={(event) => setInvalidationReason(event.target.value)}
                          placeholder="Why is this entry invalid?"
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-200/60"
                        />
                        <button type="submit" disabled={isSaving} className="rounded-full border border-amber-200/20 px-3 py-2 text-xs text-amber-100 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Confirm invalidation</button>
                        <button type="button" onClick={() => { setInvalidationId(null); setInvalidationReason(''); }} className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Cancel</button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setInvalidationId(entry.id); setInvalidationReason(''); }}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60"
                      >
                        Invalidate
                      </button>
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-zinc-500">
            No observations yet. Entries you choose to add will remain accessible here, including backdated and invalidated records.
          </p>
        )}
      </section>
    </div>
  );
}
