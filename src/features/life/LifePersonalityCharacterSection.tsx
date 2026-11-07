import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { PersonalityCharacterSnapshot, TraitExample, TraitImportance, TraitReflectionRevision } from './domain/personalityTraits';
import {
  addPersonalityTraitDefinition,
  addPersonalityTraitReflection,
  createPersonalityTrait,
  loadPersonalityCharacter,
  removePersonalityTraitExample,
  savePersonalityTraitExample,
  setPersonalityTraitActive,
} from './persistence/lifeRepository';
import { createLifeId, formatLifeDate, LifeFormActions, LifeSection } from './LifeFields';

const fieldClass = 'mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20';
const actionClass = 'rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-sm font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60';
const importanceOptions: Array<{ value: TraitImportance | ''; label: string }> = [
  { value: '', label: 'No importance set' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

type TraitForm = { name: string; definition: string; description: string };
type ReflectionForm = {
  currentExpression: string;
  desiredExpression: string;
  personalMeaning: string;
  importance: TraitImportance | '';
  developmentNotes: string;
};
type ExampleForm = { id?: string; description: string; occurredOn: string; context: string; recordedAt?: string };

const blankReflection = (): ReflectionForm => ({
  currentExpression: '',
  desiredExpression: '',
  personalMeaning: '',
  importance: '',
  developmentNotes: '',
});
const blankExample = (): ExampleForm => ({
  description: '',
  occurredOn: localCalendarDate(),
  context: '',
});

function localCalendarDate(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatOccurrenceDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(year, month - 1, day));
}

function latestBy<T extends { createdAt: string; id: string }>(items: T[]): T | null {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt) || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0))[0] ?? null;
}

function currentDefinition(snapshot: PersonalityCharacterSnapshot, traitId: string) {
  return latestBy(snapshot.definitions.filter((definition) => definition.traitId === traitId));
}

function currentReflection(snapshot: PersonalityCharacterSnapshot, traitId: string) {
  return latestBy(snapshot.reflections.filter((reflection) => reflection.traitId === traitId));
}

function toReflectionForm(reflection: TraitReflectionRevision | null): ReflectionForm {
  return reflection ? {
    currentExpression: reflection.currentExpression ?? '',
    desiredExpression: reflection.desiredExpression ?? '',
    personalMeaning: reflection.personalMeaning ?? '',
    importance: reflection.importance ?? '',
    developmentNotes: reflection.developmentNotes ?? '',
  } : blankReflection();
}

function fieldValue(form: ReflectionForm, key: keyof ReflectionForm): string {
  const value = form[key];
  return value;
}

export function LifePersonalityCharacterSection({ onDataChange }: { onDataChange: () => void }) {
  const [snapshot, setSnapshot] = useState<PersonalityCharacterSnapshot | null>(null);
  const [selectedTraitId, setSelectedTraitId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [traitForm, setTraitForm] = useState<TraitForm | null>(null);
  const [editingTraitId, setEditingTraitId] = useState<string | null>(null);
  const [reflectionForm, setReflectionForm] = useState<ReflectionForm | null>(null);
  const [exampleForm, setExampleForm] = useState<ExampleForm | null>(null);
  const [confirmDeactivateId, setConfirmDeactivateId] = useState<string | null>(null);
  const [confirmDeleteExampleId, setConfirmDeleteExampleId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const refresh = async () => {
    const data = await loadPersonalityCharacter();
    setSnapshot(data);
    setSelectedTraitId((current) => current && data.traits.some((trait) => trait.id === current) ? current : null);
  };

  useEffect(() => {
    let active = true;
    void loadPersonalityCharacter()
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((loadError) => {
        console.error('Failed to load personality and character traits', loadError);
        if (active) setError('Personality & Character could not be loaded from local storage.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleTraits = useMemo(
    () => snapshot?.traits.filter((trait) => showInactive || trait.isActive) ?? [],
    [snapshot, showInactive],
  );
  const selectedTrait = snapshot?.traits.find((trait) => trait.id === selectedTraitId) ?? null;
  const definition = selectedTrait && snapshot ? currentDefinition(snapshot, selectedTrait.id) : null;
  const reflection = selectedTrait && snapshot ? currentReflection(snapshot, selectedTrait.id) : null;
  const examples = selectedTrait && snapshot
    ? snapshot.examples.filter((example) => example.traitId === selectedTrait.id)
    : [];
  const reflectionHistory = selectedTrait && snapshot
    ? snapshot.reflections.filter((item) => item.traitId === selectedTrait.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0))
    : [];
  const definitionHistory = selectedTrait && snapshot
    ? snapshot.definitions.filter((item) => item.traitId === selectedTrait.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0))
    : [];

  const runSave = async (operation: () => Promise<void>, success: () => void) => {
    setError('');
    setIsSaving(true);
    try {
      await operation();
      await refresh();
      onDataChange();
      success();
    } catch (saveError) {
      console.error('Failed to save personality and character data', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Your changes could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const submitTrait = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!traitForm) return;
    const now = new Date().toISOString();
    const normalized = {
      name: traitForm.name.trim(),
      definition: traitForm.definition.trim(),
      description: traitForm.description.trim() || undefined,
    };
    if (!normalized.name || !normalized.definition) {
      setError('Enter a trait name and definition.');
      return;
    }
    if (editingTraitId) {
      const current = definition;
      if (!current) return;
      if (current.name === normalized.name && current.definition === normalized.definition && current.description === normalized.description) {
        setTraitForm(null);
        setEditingTraitId(null);
        return;
      }
      await runSave(
        () => addPersonalityTraitDefinition({
          id: createLifeId('trait-definition'),
          traitId: editingTraitId,
          ...normalized,
          createdAt: now,
        }),
        () => { setTraitForm(null); setEditingTraitId(null); },
      );
      return;
    }
    const traitId = createLifeId('custom-trait');
    await runSave(
      () => createPersonalityTrait(
        { id: traitId, isBuiltIn: false, isActive: true, createdAt: now, updatedAt: now },
        { id: createLifeId('trait-definition'), traitId, ...normalized, createdAt: now },
      ),
      () => { setTraitForm(null); setSelectedTraitId(traitId); },
    );
  };

  const submitReflection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTrait || !definition || !reflectionForm) return;
    const values = {
      currentExpression: reflectionForm.currentExpression.trim() || undefined,
      desiredExpression: reflectionForm.desiredExpression.trim() || undefined,
      personalMeaning: reflectionForm.personalMeaning.trim() || undefined,
      importance: reflectionForm.importance || undefined,
      developmentNotes: reflectionForm.developmentNotes.trim() || undefined,
    };
    if (!values.currentExpression && !values.desiredExpression && !values.personalMeaning && !values.importance && !values.developmentNotes) {
      setError('Add a reflection, importance, or development note before saving.');
      return;
    }
    if (reflection && Object.keys(values).every((key) => {
      const field = key as keyof typeof values;
      return values[field] === reflection[field];
    })) {
      setReflectionForm(null);
      return;
    }
    await runSave(
      () => addPersonalityTraitReflection({
        id: createLifeId('trait-reflection'),
        traitId: selectedTrait.id,
        definitionRevisionId: definition.id,
        ...values,
        createdAt: new Date().toISOString(),
      }),
      () => setReflectionForm(null),
    );
  };

  const submitExample = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTrait || !exampleForm) return;
    const now = new Date().toISOString();
    await runSave(
      () => savePersonalityTraitExample({
        id: exampleForm.id ?? createLifeId('trait-example'),
        traitId: selectedTrait.id,
        description: exampleForm.description.trim(),
        occurredOn: exampleForm.occurredOn,
        context: exampleForm.context.trim() || undefined,
        recordedAt: exampleForm.recordedAt ?? now,
        updatedAt: now,
      }),
      () => setExampleForm(null),
    );
  };

  const deactivateTrait = async (traitId: string, isActive: boolean) => {
    await runSave(
      () => setPersonalityTraitActive(traitId, isActive, new Date().toISOString()),
      () => setConfirmDeactivateId(null),
    );
  };

  if (isLoading) {
    return (
      <LifeSection id="life-personality-character" eyebrow="Personality & Character" title="Qualities you choose to embody" description="A reflective space, not a test or a ranking.">
        <p role="status" className="text-sm text-zinc-400">Loading your traits…</p>
      </LifeSection>
    );
  }

  return (
    <LifeSection
      id="life-personality-character"
      eyebrow="Personality & Character"
      title="Qualities you choose to embody"
      description="Explore what these qualities mean to you, how they show up, and how you hope to express them. This is reflection, not a test or a ranking."
    >
      {error ? <p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-sm text-rose-200">{error}</p> : null}
      {!snapshot ? (
        <p className="text-sm text-zinc-400">Your trait records are not available right now.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-5 text-zinc-500">Every trait is optional. There is no required order or ideal amount of development.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={actionClass}
                onClick={() => { setTraitForm({ name: '', definition: '', description: '' }); setEditingTraitId(null); setError(''); }}
              >
                Add a personal trait
              </button>
              <button type="button" className="rounded-full px-3 py-2 text-xs text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60" onClick={() => setShowInactive((value) => !value)}>
                {showInactive ? 'Hide inactive traits' : 'Show inactive traits'}
              </button>
            </div>
          </div>

          <ul aria-label="Available traits" className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTraits.map((trait) => {
              const traitDefinition = currentDefinition(snapshot, trait.id);
              const isSelected = selectedTraitId === trait.id;
              return (
                <li key={trait.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { setSelectedTraitId(trait.id); setError(''); setTraitForm(null); setReflectionForm(null); setExampleForm(null); }}
                    className={`w-full rounded-2xl border p-3 text-left transition-colors motion-reduce:transition-none focus:outline-none focus:ring-2 focus:ring-purple-200/60 ${isSelected ? 'border-purple-200/35 bg-purple-200/[0.09]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'} ${!trait.isActive ? 'opacity-60' : ''}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-100">{traitDefinition?.name ?? 'Unnamed trait'}</span>
                      <span className="text-[9px] uppercase tracking-[0.16em] text-zinc-500">{trait.isBuiltIn ? 'Starter' : 'Personal'}</span>
                    </span>
                    {!trait.isActive ? <span className="mt-1 block text-[10px] text-zinc-500">Inactive</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>

          {traitForm ? (
            <form onSubmit={submitTrait} className="mt-5 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4 sm:p-5">
              <h4 className="font-semibold text-zinc-100">{editingTraitId ? 'Revise personal trait definition' : 'Create a personal trait'}</h4>
              <label className="block text-sm font-medium text-zinc-200">
                Name
                <input required autoFocus value={traitForm.name} onChange={(event) => setTraitForm((form) => form && ({ ...form, name: event.target.value }))} className={fieldClass} />
              </label>
              <label className="block text-sm font-medium text-zinc-200">
                Definition
                <textarea required rows={3} value={traitForm.definition} onChange={(event) => setTraitForm((form) => form && ({ ...form, definition: event.target.value }))} className={`${fieldClass} resize-y leading-6`} />
              </label>
              <label className="block text-sm font-medium text-zinc-200">
                Description (optional)
                <textarea rows={2} value={traitForm.description} onChange={(event) => setTraitForm((form) => form && ({ ...form, description: event.target.value }))} className={`${fieldClass} resize-y leading-6`} />
              </label>
              <LifeFormActions onCancel={() => { setTraitForm(null); setEditingTraitId(null); }} isSaving={isSaving} saveLabel={editingTraitId ? 'Save a definition revision' : 'Create trait'} />
            </form>
          ) : null}

          {selectedTrait && definition && !traitForm ? (
            <section aria-labelledby="selected-trait-title" className="mt-5 rounded-2xl border border-purple-200/10 bg-black/20 p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-purple-200/65">
                    {selectedTrait.isBuiltIn ? 'Starter trait' : 'Personal trait'}{!selectedTrait.isActive ? ' · Inactive' : ''}
                  </p>
                  <h4 id="selected-trait-title" className="mt-2 text-xl font-semibold text-white">{definition.name}</h4>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">{definition.definition}</p>
                  {definition.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{definition.description}</p> : null}
                  {definitionHistory.length > 1 ? (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Earlier definitions ({definitionHistory.length - 1})</summary>
                      <ol className="mt-2 space-y-2">
                        {definitionHistory.slice(1).map((item) => <li key={item.id} className="rounded-xl border border-white/[0.06] p-3">
                          <p className="text-xs text-zinc-500">{formatLifeDate(item.createdAt)}</p>
                          <p className="mt-1 text-sm font-medium text-zinc-200">{item.name}</p>
                          <p className="mt-1 text-xs leading-5 text-zinc-400">{item.definition}</p>
                          {item.description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{item.description}</p> : null}
                        </li>)}
                      </ol>
                    </details>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!selectedTrait.isBuiltIn && selectedTrait.isActive ? (
                    <button type="button" className="rounded-full px-3 py-2 text-xs text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60" onClick={() => {
                      setEditingTraitId(selectedTrait.id);
                      setTraitForm({ name: definition.name, definition: definition.definition, description: definition.description ?? '' });
                    }}>Edit definition</button>
                  ) : null}
                  {!selectedTrait.isBuiltIn ? (
                    <button
                      type="button"
                      className="rounded-full px-3 py-2 text-xs text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60"
                      onClick={() => setConfirmDeactivateId((current) => current === selectedTrait.id ? null : selectedTrait.id)}
                    >{selectedTrait.isActive ? 'Deactivate' : 'Reactivate'}</button>
                  ) : null}
                </div>
              </div>
              {confirmDeactivateId === selectedTrait.id ? (
                <div role="group" aria-label="Confirm trait status change" className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/[0.035] p-3">
                  <p className="text-sm text-zinc-300">{selectedTrait.isActive ? 'Deactivate this trait? Its definition, reflections, and examples will remain saved.' : 'Reactivate this trait and make it available for new reflections?'}</p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={isSaving} className={actionClass} onClick={() => void deactivateTrait(selectedTrait.id, !selectedTrait.isActive)}>{selectedTrait.isActive ? 'Confirm deactivation' : 'Confirm reactivation'}</button>
                    <button type="button" className="rounded-full px-3 py-2 text-xs text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-200/60" onClick={() => setConfirmDeactivateId(null)}>Cancel</button>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div>
                  <h5 className="text-sm font-semibold text-purple-100">Current & desired expression</h5>
                  {reflection ? (
                    <div className="mt-3 space-y-3">
                      {reflection.currentExpression ? <ReflectionText label="How I currently demonstrate this" value={reflection.currentExpression} /> : null}
                      {reflection.desiredExpression ? <ReflectionText label="How I hope to embody it" value={reflection.desiredExpression} /> : null}
                      {reflection.personalMeaning ? <ReflectionText label="What it means to me" value={reflection.personalMeaning} /> : null}
                      {reflection.importance ? <p className="text-xs text-zinc-500">Personal importance: <span className="text-zinc-300">{reflection.importance}</span></p> : null}
                      {reflection.developmentNotes ? <ReflectionText label="Development notes" value={reflection.developmentNotes} /> : null}
                      <p className="text-[11px] text-zinc-600">Reflected {formatLifeDate(reflection.createdAt)}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-zinc-500">No reflection yet. You can begin with one prompt, or leave this trait unexplored.</p>
                  )}
                  {selectedTrait.isActive ? (
                    <button type="button" className={`${actionClass} mt-4`} onClick={() => setReflectionForm(toReflectionForm(reflection))}>
                      {reflection ? 'Add a reflection revision' : 'Reflect on this trait'}
                    </button>
                  ) : null}
                  {reflectionHistory.length > 1 ? (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-200/60">Earlier reflections ({reflectionHistory.length - 1})</summary>
                      <ol className="mt-3 space-y-3">
                        {reflectionHistory.slice(1).map((item) => <li key={item.id} className="rounded-xl border border-white/[0.06] p-3">
                          <p className="text-xs text-zinc-500">{formatLifeDate(item.createdAt)}{item.importance ? ` · ${item.importance} importance` : ''}</p>
                          {snapshot.definitions.find(({ id }) => id === item.definitionRevisionId) ? (
                            <p className="mt-2 text-xs leading-5 text-zinc-500">
                              Definition then: {snapshot.definitions.find(({ id }) => id === item.definitionRevisionId)?.definition}
                            </p>
                          ) : null}
                          {item.currentExpression ? <ReflectionText label="Current expression" value={item.currentExpression} /> : null}
                          {item.desiredExpression ? <ReflectionText label="Desired expression" value={item.desiredExpression} /> : null}
                          {item.personalMeaning ? <ReflectionText label="Personal meaning" value={item.personalMeaning} /> : null}
                          {item.developmentNotes ? <ReflectionText label="Development notes" value={item.developmentNotes} /> : null}
                        </li>)}
                      </ol>
                    </details>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h5 className="text-sm font-semibold text-purple-100">Supporting examples</h5>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">Examples are personal context, not proof or an automatic assessment.</p>
                    </div>
                    {selectedTrait.isActive ? <button type="button" className="rounded-full px-3 py-2 text-xs text-purple-100 hover:bg-purple-200/[0.06] focus:outline-none focus:ring-2 focus:ring-purple-200/60" onClick={() => setExampleForm(blankExample())}>Add example</button> : null}
                  </div>
                  {examples.length ? (
                    <ul className="mt-3 space-y-2">
                      {[...examples].reverse().map((example) => (
                        <li key={example.id} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-xs text-zinc-500">Occurred {formatOccurrenceDate(example.occurredOn)} · Recorded {formatLifeDate(example.recordedAt)}</p>
                            <div className="flex gap-2">
                              {selectedTrait.isActive ? <button type="button" className="text-xs text-zinc-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60" onClick={() => setExampleForm({ id: example.id, description: example.description, occurredOn: example.occurredOn, context: example.context ?? '', recordedAt: example.recordedAt })}>Edit</button> : null}
                              <button type="button" className="text-xs text-zinc-500 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200/60" onClick={() => setConfirmDeleteExampleId((current) => current === example.id ? null : example.id)}>Remove</button>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{example.description}</p>
                          {example.context ? <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">{example.context}</p> : null}
                          {example.updatedAt !== example.recordedAt ? <p className="mt-2 text-[10px] text-zinc-600">Edited {formatLifeDate(example.updatedAt)}</p> : null}
                          {confirmDeleteExampleId === example.id ? (
                            <div className="mt-3 flex items-center gap-2" role="group" aria-label="Confirm example removal">
                              <span className="text-xs text-zinc-400">Remove this personal example?</span>
                              <button type="button" disabled={isSaving} className="text-xs text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200/60" onClick={() => void runSave(() => removePersonalityTraitExample(example.id), () => setConfirmDeleteExampleId(null))}>Confirm</button>
                              <button type="button" className="text-xs text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-200/60" onClick={() => setConfirmDeleteExampleId(null)}>Cancel</button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 rounded-xl border border-dashed border-white/[0.08] p-4 text-sm leading-6 text-zinc-500">No examples saved. Add a moment or decision that feels relevant to you, if you wish.</p>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {reflectionForm && selectedTrait ? (
            <form onSubmit={submitReflection} className="mt-5 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4 sm:p-5">
              <h4 className="font-semibold text-zinc-100">A reflection on {definition?.name}</h4>
              <p className="text-xs leading-5 text-zinc-500">Answer any prompt that feels useful. Saving creates a new revision; previous reflections remain available.</p>
              <ReflectionField label="How do I currently demonstrate this quality?" value={fieldValue(reflectionForm, 'currentExpression')} onChange={(value) => setReflectionForm((form) => form && ({ ...form, currentExpression: value }))} />
              <ReflectionField label="How do I want to embody it?" value={fieldValue(reflectionForm, 'desiredExpression')} onChange={(value) => setReflectionForm((form) => form && ({ ...form, desiredExpression: value }))} />
              <ReflectionField label="What does this trait mean to me?" value={fieldValue(reflectionForm, 'personalMeaning')} onChange={(value) => setReflectionForm((form) => form && ({ ...form, personalMeaning: value }))} />
              <label className="block text-sm font-medium text-zinc-200">
                Personal importance (optional)
                <select value={reflectionForm.importance} onChange={(event) => setReflectionForm((form) => form && ({ ...form, importance: event.target.value as TraitImportance | '' }))} className={fieldClass}>
                  {importanceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <ReflectionField label="Development notes (optional)" value={reflectionForm.developmentNotes} onChange={(value) => setReflectionForm((form) => form && ({ ...form, developmentNotes: value }))} />
              <LifeFormActions onCancel={() => setReflectionForm(null)} isSaving={isSaving} saveLabel="Save reflection revision" />
            </form>
          ) : null}

          {exampleForm && selectedTrait ? (
            <form onSubmit={submitExample} className="mt-5 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4 sm:p-5">
              <h4 className="font-semibold text-zinc-100">{exampleForm.id ? 'Edit supporting example' : 'Add a supporting example'}</h4>
              <label className="block text-sm font-medium text-zinc-200">
                What happened?
                <textarea required autoFocus rows={3} value={exampleForm.description} onChange={(event) => setExampleForm((form) => form && ({ ...form, description: event.target.value }))} className={`${fieldClass} resize-y leading-6`} />
              </label>
              <label className="block text-sm font-medium text-zinc-200">
                When did it happen?
                <input required type="date" value={exampleForm.occurredOn} onChange={(event) => setExampleForm((form) => form && ({ ...form, occurredOn: event.target.value }))} className={fieldClass} />
              </label>
              <label className="block text-sm font-medium text-zinc-200">
                Context (optional)
                <textarea rows={2} value={exampleForm.context} onChange={(event) => setExampleForm((form) => form && ({ ...form, context: event.target.value }))} className={`${fieldClass} resize-y leading-6`} />
              </label>
              {exampleForm.recordedAt ? <p className="text-xs text-zinc-500">Originally recorded {formatLifeDate(exampleForm.recordedAt)}. Editing does not change this date.</p> : null}
              <LifeFormActions onCancel={() => setExampleForm(null)} isSaving={isSaving} saveLabel={exampleForm.id ? 'Save example correction' : 'Save example'} />
            </form>
          ) : null}

          {snapshot.traits.length === 0 ? <p className="mt-5 text-sm text-zinc-500">No traits are available yet. You can add a personal trait whenever you are ready.</p> : null}
        </>
      )}
    </LifeSection>
  );
}

function ReflectionText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{value}</p>
    </div>
  );
}

function ReflectionField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-sm font-medium text-zinc-200">
      {label}
      <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} resize-y leading-6`} />
    </label>
  );
}
