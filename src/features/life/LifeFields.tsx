import { useEffect, useRef, type ChangeEventHandler, type ReactNode, type Ref } from 'react';

export function useLifeEditorFocus<T extends HTMLElement>(isEditing: boolean) {
  const firstFieldRef = useRef<T>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (isEditing) {
      firstFieldRef.current?.focus();
    } else if (wasEditing.current) {
      triggerRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  return { firstFieldRef, triggerRef };
}

interface LifeFieldProps {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  type?: 'text' | 'date';
  hint?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function LifeField({ label, value, onChange, placeholder, type = 'text', hint, inputRef }: LifeFieldProps) {
  return (
    <label className="block text-sm font-medium text-zinc-200">
      {label}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
      />
      {hint ? <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

interface LifeTextareaProps {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  placeholder?: string;
  rows?: number;
  hint?: string;
  textareaRef?: Ref<HTMLTextAreaElement>;
}

export function LifeTextarea({ label, value, onChange, placeholder, rows = 4, hint, textareaRef }: LifeTextareaProps) {
  return (
    <label className="block text-sm font-medium text-zinc-200">
      {label}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white placeholder:text-zinc-600 focus:border-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20"
      />
      {hint ? <span className="mt-2 block text-xs font-normal leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

export function LifeSection({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="surface overflow-hidden rounded-[26px] border border-purple-300/10 bg-[#09070f]/85 p-5 shadow-[0_20px_80px_rgba(27,10,47,0.18)] sm:p-7">
      <div className="mb-6 border-b border-white/[0.07] pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-200/65">{eyebrow}</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function LifeFormActions({
  onCancel,
  isSaving,
  saveLabel = 'Save reflection',
}: {
  onCancel: () => void;
  isSaving: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-full bg-purple-200 px-5 py-2.5 text-sm font-semibold text-[#160e20] transition-colors hover:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200/70 disabled:cursor-wait disabled:opacity-60"
      >
        {isSaving ? 'Saving…' : saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="rounded-full border border-white/10 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-purple-200/50"
      >
        Cancel
      </button>
    </div>
  );
}

export function createLifeId(prefix: string): string {
  const suffix = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

export function formatLifeDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}
