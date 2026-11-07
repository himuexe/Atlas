import { useState, type FormEvent } from 'react';
import type { LifeCurrentSelf } from './domain/types';
import { useLifeContext } from './LifeContext';
import { LifeFormActions, LifeSection, LifeTextarea, useLifeEditorFocus } from './LifeFields';

type CurrentSelfForm = Omit<LifeCurrentSelf, 'id' | 'updatedAt'>;

const currentSelfFields: Array<[keyof CurrentSelfForm, string, string]> = [
  ['physicalCondition', 'Physical condition & lifestyle', 'How are your energy, movement, rest, and day-to-day care feeling? No need to repeat tracked metrics.'],
  ['careerSituation', 'Career & professional situation', 'What is working, changing, or uncertain in your work and contribution?'],
  ['financialCircumstances', 'Financial circumstances', 'Describe your sense of stability and the context you are navigating, without repeating account records.'],
  ['knowledgeCapabilities', 'Knowledge & capabilities', 'What are you learning, practicing, or able to do today?'],
  ['relationshipsSocialLife', 'Relationships & social life', 'How do your important connections and community feel right now?'],
  ['habitsCharacter', 'Personal habits & character', 'Which patterns or qualities are showing up in your everyday choices?'],
  ['currentChallenges', 'Current challenges', 'What feels difficult or asks for your attention at this point in life?'],
  ['currentStrengths', 'Current strengths', 'What qualities, support, or capabilities are helping you meet this season?'],
];

export function LifeCurrentSelfSection() {
  const { currentSelf, updateCurrentSelf } = useLifeContext();
  const [isEditing, setIsEditing] = useState(false);
  const { firstFieldRef, triggerRef } = useLifeEditorFocus<HTMLTextAreaElement>(isEditing);
  const [form, setForm] = useState<CurrentSelfForm>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const beginEditing = () => {
    setForm({ ...currentSelf });
    setSaveError('');
    setIsEditing(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      await updateCurrentSelf({ id: 'current', ...form, updatedAt: new Date().toISOString() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save Current Self reflection', error);
      setSaveError('Your reflection could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasContent = Boolean(currentSelf && currentSelfFields.some(([key]) => currentSelf[key]?.trim()));

  return (
    <LifeSection
      id="life-current-self"
      eyebrow="Current Self"
      title="How life looks from where you are"
      description="A personal reflection, not a scorecard or another tracker. You can leave any part blank and return when your perspective changes."
    >
      {isEditing ? (
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-5 lg:grid-cols-2">
            {currentSelfFields.map(([key, label, placeholder], index) => (
              <LifeTextarea
                key={key}
                label={label}
                textareaRef={index === 0 ? firstFieldRef : undefined}
                value={form[key] ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={placeholder}
                rows={3}
              />
            ))}
          </div>
          {saveError ? <p role="alert" className="text-sm text-rose-300">{saveError}</p> : null}
          <LifeFormActions onCancel={() => setIsEditing(false)} isSaving={isSaving} saveLabel="Save Current Self" />
        </form>
      ) : (
        <div>
          {hasContent ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {currentSelfFields.map(([key, label]) => {
                const value = currentSelf?.[key];
                if (!value?.trim()) return null;
                return (
                  <article key={key} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                    <h4 className="text-sm font-semibold text-purple-100">{label}</h4>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{value}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              Your present life is more than what can be measured. Use these prompts to name what feels true now—strengths and challenges alike.
            </p>
          )}
          <button
            ref={triggerRef}
            type="button"
            onClick={beginEditing}
            className="mt-6 rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-sm font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
          >
            {hasContent ? 'Edit Current Self' : 'Describe your Current Self'}
          </button>
        </div>
      )}
    </LifeSection>
  );
}
