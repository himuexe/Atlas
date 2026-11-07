import { useState, type FormEvent } from 'react';
import { createLifeId } from './LifeFields';
import {
  attributeKinds,
  isAttributeKind,
  isAttributeValueType,
  isLifePriority,
  lifePriorities,
  type AttributeDefinition,
  type AttributeKind,
  type AttributeValueType,
  type LifeDimension,
  type LifePriority,
} from './domain/types';
import { useLifeContext } from './LifeContext';

const fieldClassName = 'mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20';
const buttonClassName = 'rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-3.5 py-2 text-xs font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60';

function DimensionForm({
  existing,
  dimensions,
  onCancel,
}: {
  existing?: LifeDimension;
  dimensions: LifeDimension[];
  onCancel: () => void;
}) {
  const { saveDimension } = useLifeContext();
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Enter a name for this dimension.');
      return;
    }
    setIsSaving(true);
    setError('');
    const now = new Date().toISOString();
    try {
      await saveDimension({
        id: existing?.id ?? createLifeId('dimension'),
        name: name.trim(),
        description: description.trim(),
        isBuiltIn: false,
        isActive: existing?.isActive ?? true,
        position: existing?.position ?? Math.max(19, ...dimensions.map((dimension) => dimension.position)) + 1,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      });
      onCancel();
    } catch (saveError) {
      console.error('Failed to save Life dimension', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The dimension could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4">
      <label className="block text-sm font-medium text-zinc-200">
        Dimension name
        <input autoFocus required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={fieldClassName} />
      </label>
      <label className="block text-sm font-medium text-zinc-200">
        Description
        <textarea maxLength={500} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className={`${fieldClassName} resize-y leading-6`} />
      </label>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving} className="rounded-full bg-purple-200 px-4 py-2 text-xs font-semibold text-[#160e20] disabled:opacity-60">
          {isSaving ? 'Saving…' : existing ? 'Save dimension' : 'Create dimension'}
        </button>
        <button type="button" disabled={isSaving} onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function LifeDimensionControls({ dimension }: { dimension?: LifeDimension }) {
  const { dimensions, saveDimension } = useLifeContext();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleActive = async () => {
    if (!dimension) return;
    setIsSaving(true);
    setError('');
    try {
      await saveDimension({ ...dimension, isActive: !dimension.isActive, updatedAt: new Date().toISOString() });
      setConfirmingDeactivation(false);
    } catch (saveError) {
      console.error('Failed to update Life dimension status', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The dimension status could not be changed.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return <DimensionForm existing={dimension} dimensions={dimensions} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {dimension ? (
          <>
            <button type="button" onClick={() => setIsEditing(true)} className={buttonClassName}>Edit dimension</button>
            {dimension.isActive ? (
              <button type="button" onClick={() => setConfirmingDeactivation(true)} className="rounded-full border border-white/10 px-3.5 py-2 text-xs text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">
                Deactivate dimension
              </button>
            ) : (
              <button type="button" disabled={isSaving} onClick={() => void toggleActive()} className={buttonClassName}>
                {isSaving ? 'Reactivating…' : 'Reactivate dimension'}
              </button>
            )}
          </>
        ) : (
          <button type="button" onClick={() => setIsEditing(true)} className={buttonClassName}>Add a custom dimension</button>
        )}
      </div>
      {confirmingDeactivation && dimension ? (
        <div className="mt-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.035] p-4">
          <p className="text-sm text-zinc-200">Deactivate {dimension.name}?</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">Its attributes will be deactivated too. Existing entries, targets, milestones, and evidence are retained. You can reactivate the dimension later.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={isSaving} onClick={() => void toggleActive()} className="rounded-full bg-purple-200 px-4 py-2 text-xs font-semibold text-[#160e20] disabled:opacity-60">
              {isSaving ? 'Deactivating…' : 'Confirm deactivation'}
            </button>
            <button type="button" disabled={isSaving} onClick={() => setConfirmingDeactivation(false)} className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">
              Keep active
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}

const typeOptions: Record<AttributeKind, AttributeValueType[]> = {
  measurement: ['numeric', 'counter', 'frequency'],
  capability: ['narrative', 'boolean'],
  'subjective-assessment': ['rating', 'boolean', 'narrative'],
};

const kindLabels: Record<AttributeKind, string> = {
  measurement: 'Measurement',
  capability: 'Capability',
  'subjective-assessment': 'Subjective assessment',
};

const typeLabels: Record<AttributeValueType, string> = {
  numeric: 'Number',
  rating: 'Rating',
  boolean: 'Yes / no',
  counter: 'Counter',
  frequency: 'Frequency',
  milestone: 'Milestone',
  narrative: 'Narrative',
};

interface AttributeFormState {
  name: string;
  description: string;
  dimensionId: string;
  kind: AttributeKind;
  valueType: AttributeValueType;
  unit: string;
  measurementFrequency: string;
  assessmentMethodology: string;
  measurementSource: string;
  priority: LifePriority;
}

function AttributeForm({
  attribute,
  dimension,
  dimensions,
  onCancel,
}: {
  attribute?: AttributeDefinition;
  dimension: LifeDimension;
  dimensions: LifeDimension[];
  onCancel: () => void;
}) {
  const { saveAttribute } = useLifeContext();
  const [form, setForm] = useState<AttributeFormState>({
    name: attribute?.name ?? '',
    description: attribute?.description ?? '',
    dimensionId: attribute?.dimensionId ?? dimension.id,
    kind: attribute?.kind ?? 'subjective-assessment',
    valueType: attribute?.valueType ?? 'rating',
    unit: attribute?.unit ?? '',
    measurementFrequency: attribute?.measurementFrequency ?? '',
    assessmentMethodology: attribute?.assessmentMethodology ?? '',
    measurementSource: attribute?.measurementSource ?? '',
    priority: attribute?.priority ?? 'medium',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const updateKind = (kind: AttributeKind) => {
    setForm((current) => ({ ...current, kind, valueType: typeOptions[kind][0] }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Enter a name for this attribute.');
      return;
    }
    setIsSaving(true);
    setError('');
    const now = new Date().toISOString();
    try {
      await saveAttribute({
        id: attribute?.id ?? createLifeId('attribute'),
        dimensionId: form.dimensionId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        kind: form.kind,
        valueType: form.valueType,
        unit: form.kind === 'measurement' ? form.unit.trim() || undefined : undefined,
        measurementFrequency: form.measurementFrequency.trim() || undefined,
        assessmentMethodology: form.assessmentMethodology.trim() || undefined,
        measurementSource: form.measurementSource.trim() || undefined,
        priority: form.priority,
        isBuiltIn: false,
        isActive: attribute?.isActive ?? true,
        createdAt: attribute?.createdAt ?? now,
        updatedAt: now,
      });
      onCancel();
    } catch (saveError) {
      console.error('Failed to save Life attribute', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The attribute could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeDimensions = dimensions.filter((item) => item.isActive);

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-200">
          Attribute name
          <input autoFocus required maxLength={100} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClassName} />
        </label>
        <label className="block text-sm font-medium text-zinc-200">
          Dimension
          <select value={form.dimensionId} onChange={(event) => setForm((current) => ({ ...current, dimensionId: event.target.value }))} className={fieldClassName}>
            {activeDimensions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-200">
          Assessment methodology (optional)
          <textarea maxLength={500} rows={2} value={form.assessmentMethodology} onChange={(event) => setForm((current) => ({ ...current, assessmentMethodology: event.target.value }))} className={`${fieldClassName} resize-y leading-6`} />
        </label>
        <label className="block text-sm font-medium text-zinc-200">
          Measurement source (optional)
          <textarea maxLength={500} rows={2} value={form.measurementSource} onChange={(event) => setForm((current) => ({ ...current, measurementSource: event.target.value }))} className={`${fieldClassName} resize-y leading-6`} />
        </label>
      </div>
      <label className="block text-sm font-medium text-zinc-200">
        Description
        <textarea maxLength={500} rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${fieldClassName} resize-y leading-6`} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-200">
          Category
          <select
            value={form.kind}
            onChange={(event) => {
              if (isAttributeKind(event.target.value)) updateKind(event.target.value);
            }}
            className={fieldClassName}
          >
            {attributeKinds.map((kind) => <option key={kind} value={kind}>{kindLabels[kind]}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-zinc-200">
          {form.kind === 'measurement' ? 'Measurement type' : 'Value format'}
          <select
            value={form.valueType}
            onChange={(event) => {
              const valueType = event.target.value;
              if (isAttributeValueType(valueType) && typeOptions[form.kind].includes(valueType)) {
                setForm((current) => ({ ...current, valueType }));
              }
            }}
            className={fieldClassName}
          >
            {!typeOptions[form.kind].includes(form.valueType) ? (
              <option value={form.valueType}>Existing legacy format ({typeLabels[form.valueType]})</option>
            ) : null}
            {typeOptions[form.kind].map((valueType) => <option key={valueType} value={valueType}>{typeLabels[valueType]}</option>)}
          </select>
        </label>
      </div>
      {form.kind === 'measurement' ? (
        <label className="block text-sm font-medium text-zinc-200">
          Unit (optional)
          <input maxLength={40} value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder={form.valueType === 'frequency' ? 'for example, occasions per month' : 'for example, works'} className={fieldClassName} />
        </label>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-200">
          Suggested review cadence (optional)
          <input maxLength={80} value={form.measurementFrequency} onChange={(event) => setForm((current) => ({ ...current, measurementFrequency: event.target.value }))} placeholder="Advisory only, for example quarterly" className={fieldClassName} />
        </label>
        <label className="block text-sm font-medium text-zinc-200">
          Priority
          <select
            value={form.priority}
            onChange={(event) => {
              const priority = event.target.value;
              if (isLifePriority(priority)) setForm((current) => ({ ...current, priority }));
            }}
            className={fieldClassName}
          >
            {lifePriorities.map((priority) => <option key={priority} value={priority}>{priority === 'maintain' ? 'Maintain current state' : `${priority[0].toUpperCase()}${priority.slice(1)}`}</option>)}
          </select>
        </label>
      </div>
      {attribute ? (
        <p className="text-xs leading-5 text-zinc-500">
          Attribute identity is stable. If it has history, changing its dimension, category, measurement type, or unit is blocked; create a new attribute instead.
        </p>
      ) : null}
      {error ? <p role="alert" className="text-sm leading-5 text-rose-300">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving || activeDimensions.length === 0} className="rounded-full bg-purple-200 px-4 py-2 text-xs font-semibold text-[#160e20] disabled:opacity-60">
          {isSaving ? 'Saving…' : attribute ? 'Save attribute' : 'Create attribute'}
        </button>
        <button type="button" disabled={isSaving} onClick={onCancel} className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function LifeAttributeControls({
  attribute,
  dimension,
  dimensions,
}: {
  attribute?: AttributeDefinition;
  dimension: LifeDimension;
  dimensions: LifeDimension[];
}) {
  const { saveAttribute } = useLifeContext();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleActive = async () => {
    if (!attribute) return;
    setIsSaving(true);
    setError('');
    try {
      await saveAttribute({ ...attribute, isActive: !attribute.isActive, updatedAt: new Date().toISOString() });
      setConfirmingDeactivation(false);
    } catch (saveError) {
      console.error('Failed to update Life attribute status', saveError);
      setError(saveError instanceof Error ? saveError.message : 'The attribute status could not be changed.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return <AttributeForm attribute={attribute} dimension={dimension} dimensions={dimensions} onCancel={() => setIsEditing(false)} />;
  }

  if (!attribute) {
    if (!dimension.isActive) return <p className="mt-4 text-xs text-zinc-500">Reactivate this dimension before adding attributes.</p>;
    return <button type="button" onClick={() => setIsEditing(true)} className={`${buttonClassName} mt-4`}>Add an attribute</button>;
  }

  if (attribute.isBuiltIn) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setIsEditing(true)} className={buttonClassName}>Edit</button>
        {attribute.isActive ? (
          <button type="button" onClick={() => setConfirmingDeactivation(true)} className="rounded-full border border-white/10 px-3.5 py-2 text-xs text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">
            Deactivate
          </button>
        ) : (
          <button type="button" disabled={isSaving || !dimension.isActive} onClick={() => void toggleActive()} className={buttonClassName}>
            {isSaving ? 'Reactivating…' : 'Reactivate'}
          </button>
        )}
      </div>
      {confirmingDeactivation ? (
        <div className="mt-3 rounded-2xl border border-amber-200/15 bg-amber-200/[0.035] p-4">
          <p className="text-xs leading-5 text-zinc-300">Existing entries, targets, milestones, and evidence remain attached to this attribute. You can reactivate it later.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={isSaving} onClick={() => void toggleActive()} className="rounded-full bg-purple-200 px-4 py-2 text-xs font-semibold text-[#160e20] disabled:opacity-60">
              {isSaving ? 'Deactivating…' : 'Confirm deactivation'}
            </button>
            <button type="button" disabled={isSaving} onClick={() => setConfirmingDeactivation(false)} className="rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">
              Keep active
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-xs leading-5 text-rose-300">{error}</p> : null}
    </div>
  );
}
