import { useState, type FormEvent } from 'react';
import type { LifeIdealSelfRevision } from './domain/types';
import { useLifeContext } from './LifeContext';
import { createLifeId, formatLifeDate, LifeFormActions, LifeSection, LifeTextarea, useLifeEditorFocus } from './LifeFields';

export function LifeIdealSelfSection() {
  const { idealSelf, idealSelfHistory, addIdealSelfRevision } = useLifeContext();
  const [isEditing, setIsEditing] = useState(false);
  const { firstFieldRef, triggerRef } = useLifeEditorFocus<HTMLTextAreaElement>(isEditing);
  const [narrative, setNarrative] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const beginEditing = () => {
    setNarrative(idealSelf?.narrative ?? '');
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = narrative.trim();
    if (!trimmed) {
      setSaveError('Write a few words about the person you hope to become.');
      return;
    }
    if (trimmed === idealSelf?.narrative) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      const revision: LifeIdealSelfRevision = {
        id: createLifeId('ideal-self'),
        narrative: trimmed,
        createdAt: new Date().toISOString(),
      };
      await addIdealSelfRevision(revision);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save Ideal Self revision', error);
      setSaveError('Your vision could not be saved. Your previous version is unchanged.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LifeSection
      id="life-ideal-self"
      eyebrow="Ideal Self"
      title="A direction you choose"
      description="Describe the person and life you aspire to grow toward. This is a living vision, not a measure of your worth or a list you must complete."
    >
      {isEditing ? (
        <form className="space-y-5" onSubmit={submit}>
          <LifeTextarea
            label="Your Ideal Self vision"
            textareaRef={firstFieldRef}
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            placeholder="Imagine a life that feels meaningful and true to you. You might write about the way you want to live, your health, work, finances, learning, relationships, character, experiences, or contribution."
            rows={10}
            hint="Write naturally in as many paragraphs as you need. No category is required."
          />
          {saveError ? <p role="alert" className="text-sm text-rose-300">{saveError}</p> : null}
          <LifeFormActions onCancel={cancelEditing} isSaving={isSaving} saveLabel={idealSelf ? 'Save a new vision revision' : 'Save your vision'} />
        </form>
      ) : (
        <div>
          {idealSelf ? (
            <div className="rounded-2xl border border-purple-200/15 bg-gradient-to-br from-purple-300/[0.08] to-transparent p-5 sm:p-7">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-200/60">Your current vision</p>
              <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-zinc-100">{idealSelf.narrative}</p>
              <p className="mt-5 text-xs text-zinc-500">Last reflected on {formatLifeDate(idealSelf.createdAt)}</p>
            </div>
          ) : (
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              Your vision can begin as a few honest sentences. It can hold ambitions and ordinary things you hope to protect.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              ref={triggerRef}
              type="button"
              onClick={beginEditing}
              className="rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-sm font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
            >
              {idealSelf ? 'Reflect on this vision' : 'Write your Ideal Self vision'}
            </button>
            {idealSelfHistory.length > 1 ? (
              <details className="group">
                <summary className="cursor-pointer rounded-full px-3 py-2.5 text-sm text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60">
                  Earlier visions ({idealSelfHistory.length - 1})
                </summary>
                <ol className="mt-3 space-y-3">
                  {[...idealSelfHistory].reverse().slice(1).map((revision) => (
                    <li key={revision.id} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                      <p className="text-xs text-zinc-500">{formatLifeDate(revision.createdAt)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{revision.narrative}</p>
                    </li>
                  ))}
                </ol>
              </details>
            ) : null}
          </div>
        </div>
      )}
    </LifeSection>
  );
}
