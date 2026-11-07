import { useState, type FormEvent } from 'react';
import type { LifeProfile } from './domain/types';
import { useLifeContext } from './LifeContext';
import { LifeField, LifeFormActions, LifeSection, LifeTextarea, useLifeEditorFocus } from './LifeFields';

type ProfileForm = Omit<LifeProfile, 'id' | 'updatedAt'>;

const emptyProfile: ProfileForm = {
  name: '',
  dateOfBirth: '',
  occupation: '',
  education: '',
  lifePhase: '',
  location: '',
  description: '',
  currentCircumstances: '',
  importantResponsibilities: '',
  interests: '',
};

const profileFields: Array<[keyof ProfileForm, string]> = [
  ['name', 'Display name'],
  ['dateOfBirth', 'Date of birth'],
  ['occupation', 'Occupation'],
  ['education', 'Education'],
  ['lifePhase', 'Current life phase'],
  ['location', 'Location'],
];

export function LifeProfileSection() {
  const { profile, updateProfile } = useLifeContext();
  const [isEditing, setIsEditing] = useState(false);
  const { firstFieldRef, triggerRef } = useLifeEditorFocus<HTMLInputElement>(isEditing);
  const [form, setForm] = useState<ProfileForm>(emptyProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const beginEditing = () => {
    setForm({ ...emptyProfile, ...profile });
    setSaveError('');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError('');
    try {
      await updateProfile({ id: 'current', ...form, updatedAt: new Date().toISOString() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save Life profile', error);
      setSaveError('Your profile could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <LifeSection
      id="life-profile"
      eyebrow="Life context"
      title={profile?.name ? `A little about ${profile.name}` : 'Your life, in context'}
      description="Start with the context that matters to you. Everything here is optional and stays in this local Atlas workspace."
    >
      {isEditing ? (
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profileFields.map(([key, label], index) => (
              <LifeField
                key={key}
                label={label}
                inputRef={index === 0 ? firstFieldRef : undefined}
                type={key === 'dateOfBirth' ? 'date' : 'text'}
                value={form[key] ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={key === 'location' ? 'A city, region, or country' : undefined}
                hint={key === 'dateOfBirth' ? 'Optional. Keep only the detail you are comfortable recording.' : undefined}
              />
            ))}
          </div>
          <LifeTextarea
            label="Personal description"
            value={form.description ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="How would you describe yourself in this season of life?"
            rows={3}
          />
          <LifeTextarea
            label="Current circumstances"
            value={form.currentCircumstances ?? ''}
            onChange={(event) => setForm((current) => ({ ...current, currentCircumstances: event.target.value }))}
            placeholder="What is shaping your days right now?"
            rows={3}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <LifeTextarea
              label="Important responsibilities"
              value={form.importantResponsibilities ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, importantResponsibilities: event.target.value }))}
              placeholder="The people, commitments, or roles you choose to care for."
              rows={3}
            />
            <LifeTextarea
              label="Personal interests"
              value={form.interests ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, interests: event.target.value }))}
              placeholder="What draws your curiosity or gives you energy?"
              rows={3}
            />
          </div>
          {saveError ? <p role="alert" className="text-sm text-rose-300">{saveError}</p> : null}
          <LifeFormActions onCancel={cancelEditing} isSaving={isSaving} saveLabel="Save life context" />
        </form>
      ) : (
        <div>
          {profile && Object.values(profile).some((value) => typeof value === 'string' && value.trim() && value !== 'current') ? (
            <div className="space-y-5">
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {profileFields.map(([key, label]) => {
                  const value = profile[key];
                  if (!value) return null;
                  return (
                    <div key={key}>
                      <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</dt>
                      <dd className="mt-1.5 text-sm text-zinc-100">{key === 'dateOfBirth' ? new Date(`${value}T00:00:00`).toLocaleDateString() : value}</dd>
                    </div>
                  );
                })}
              </dl>
              {([
                ['Personal description', profile.description],
                ['Current circumstances', profile.currentCircumstances],
                ['Important responsibilities', profile.importantResponsibilities],
                ['Personal interests', profile.interests],
              ] as const).map(([label, value]) => value ? (
                <div key={label}>
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{label}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{value}</p>
                </div>
              ) : null)}
            </div>
          ) : (
            <p className="max-w-2xl text-sm leading-6 text-zinc-400">
              There is no single right way to introduce yourself. Add only the details that help you understand your life more clearly.
            </p>
          )}
          <button
            ref={triggerRef}
            type="button"
            onClick={beginEditing}
            className="mt-6 rounded-full border border-purple-200/20 bg-purple-200/[0.06] px-4 py-2.5 text-sm font-medium text-purple-100 hover:bg-purple-200/[0.12] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
          >
            {profile ? 'Edit life context' : 'Begin your profile'}
          </button>
        </div>
      )}
    </LifeSection>
  );
}
