import { useState, type FormEvent } from 'react';
import { isLifePriority, lifePriorities, type LifePersonalValue, type LifePriority } from './domain/types';
import { useLifeContext } from './LifeContext';
import { createLifeId, LifeFormActions, LifeSection, LifeTextarea } from './LifeFields';

type ValueForm = {
  id?: string;
  name: string;
  description: string;
  priority: LifePriority;
  createdAt?: string;
};

const priorityLabels: Record<LifePriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  maintain: 'Maintain current state',
};

const emptyForm = (): ValueForm => ({ name: '', description: '', priority: 'high' });

export function LifeValuesSection() {
  const { personalValues, upsertPersonalValue, removePersonalValue } = useLifeContext();
  const [form, setForm] = useState<ValueForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const beginAdd = () => {
    setForm(emptyForm());
    setSaveError('');
  };

  const beginEdit = (value: LifePersonalValue) => {
    setForm({
      id: value.id,
      name: value.name,
      description: value.description ?? '',
      priority: value.priority,
      createdAt: value.createdAt,
    });
    setSaveError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form?.name.trim()) {
      setSaveError('Give this value a name before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    const now = new Date().toISOString();
    const value: LifePersonalValue = {
      id: form.id ?? createLifeId('value'),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      createdAt: form.createdAt ?? now,
      updatedAt: now,
    };
    try {
      await upsertPersonalValue(value);
      setForm(null);
    } catch (error) {
      console.error('Failed to save personal value', error);
      setSaveError('This value could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeValue = async (id: string) => {
    setSaveError('');
    try {
      await removePersonalValue(id);
      if (form?.id === id) setForm(null);
    } catch (error) {
      console.error('Failed to remove personal value', error);
      setSaveError('This value could not be removed. Please try again.');
    }
  };

  return (
    <LifeSection
      id="life-values"
      eyebrow="Personal values"
      title="What matters enough to guide you"
      description="Name values in your own words. Choose where your attention belongs—including areas you want to maintain, not constantly improve."
    >
      {personalValues.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {personalValues.map((value) => (
            <li key={value.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-zinc-100">{value.name}</h4>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-purple-200/65">
                    {priorityLabels[value.priority]}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => beginEdit(value)}
                    aria-label={`Edit value: ${value.name}`}
                    className="rounded-full px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/[0.06] hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeValue(value.id)}
                    aria-label={`Remove value: ${value.name}`}
                    className="rounded-full px-3 py-1.5 text-xs text-zinc-500 hover:bg-rose-300/10 hover:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-200/60"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {value.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{value.description}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-2xl text-sm leading-6 text-zinc-400">
          Values are personal, not a prescribed checklist. Begin with a word, a principle, or a way of treating people that you want to keep close.
        </p>
      )}

      {form ? (
        <form className="mt-5 space-y-4 rounded-2xl border border-purple-200/10 bg-purple-200/[0.025] p-4 sm:p-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-zinc-200">
            Value
            <input
              autoFocus
              required
              value={form.name}
              onChange={(event) => setForm((current) => current && ({ ...current, name: event.target.value }))}
              placeholder="For example: curiosity, family, craftsmanship"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
            />
          </label>
          <LifeTextarea
            label="What this value means to you"
            value={form.description}
            onChange={(event) => setForm((current) => current && ({ ...current, description: event.target.value }))}
            placeholder="How do you recognize this value in your life?"
            rows={2}
          />
          <label className="block text-sm font-medium text-zinc-200">
            Attention
            <select
              value={form.priority}
              onChange={(event) => {
                const priority = event.target.value;
                if (isLifePriority(priority)) {
                  setForm((current) => current && ({ ...current, priority }));
                }
              }}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100c17] px-4 py-3 text-sm text-white focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 sm:max-w-sm"
            >
              {lifePriorities.map((priority) => (
                <option key={priority} value={priority}>{priorityLabels[priority]}</option>
              ))}
            </select>
          </label>
          {saveError ? <p role="alert" className="text-sm text-rose-300">{saveError}</p> : null}
          <LifeFormActions
            onCancel={() => { setForm(null); setSaveError(''); }}
            isSaving={isSaving}
            saveLabel={form.id ? 'Save value' : 'Add value'}
          />
        </form>
      ) : (
        <button
          type="button"
          onClick={beginAdd}
          className="mt-6 rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-sm font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
        >
          Add a personal value
        </button>
      )}
      {!form && saveError ? <p role="alert" className="mt-3 text-sm text-rose-300">{saveError}</p> : null}
    </LifeSection>
  );
}
