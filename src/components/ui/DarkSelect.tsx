import { KeyboardEvent, useEffect, useId, useRef, useState } from 'react';

export interface SelectOption<Value extends string> {
  value: Value;
  label: string;
}

interface DarkSelectProps<Value extends string> {
  value: Value;
  options: readonly SelectOption<Value>[];
  onChange: (value: Value) => void;
  labelledBy: string;
}

/** A compact listbox-backed select used when native popup styling is inconsistent. */
export function DarkSelect<Value extends string>({ value, options, onChange, labelledBy }: DarkSelectProps<Value>) {
  const generatedId = useId();
  const listboxId = `atlas-select-${generatedId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<number | undefined>(undefined);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    setActiveIndex(selectedIndex);
  }, [selectedIndex]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleWindowBlur = () => setIsOpen(false);

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.clearTimeout(typeaheadTimerRef.current);
    };
  }, []);

  const chooseOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setActiveIndex(index);
    setIsOpen(false);
  };

  const openAt = (index: number) => {
    setActiveIndex(Math.min(Math.max(index, 0), options.length - 1));
    setIsOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!isOpen) {
        openAt(selectedIndex + direction);
        return;
      }
      setActiveIndex((current) => (current + direction + options.length) % options.length);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      openAt(event.key === 'Home' ? 0 : options.length - 1);
      return;
    }

    if (event.key === 'Escape') {
      if (isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(selectedIndex);
      }
      return;
    }

    if (event.key === 'Tab' && isOpen) {
      setIsOpen(false);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) chooseOption(activeIndex);
      else openAt(selectedIndex);
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      typeaheadRef.current += event.key.toLocaleLowerCase();
      window.clearTimeout(typeaheadTimerRef.current);
      typeaheadTimerRef.current = window.setTimeout(() => { typeaheadRef.current = ''; }, 700);
      const startIndex = isOpen ? activeIndex : selectedIndex;
      const matchOffset = Array.from({ length: options.length }, (_, offset) => (startIndex + offset + 1) % options.length)
        .find((index) => options[index].label.toLocaleLowerCase().startsWith(typeaheadRef.current));
      if (matchOffset !== undefined) {
        setActiveIndex(matchOffset);
        setIsOpen(true);
      }
    }
  };

  return (
    <div ref={rootRef} className="atlas-select">
      <button
        type="button"
        role="combobox"
        aria-labelledby={labelledBy}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-autocomplete="none"
        aria-valuetext={options[selectedIndex]?.label}
        onClick={() => {
          if (isOpen) setIsOpen(false);
          else openAt(selectedIndex);
        }}
        onKeyDown={handleKeyDown}
        className="atlas-select__trigger w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-11 text-left text-sm text-white focus-visible:outline-none"
      >
        <span>{options[selectedIndex]?.label ?? ''}</span>
        <svg className={`atlas-select__chevron ${isOpen ? 'is-open' : ''}`} viewBox="0 0 16 16" aria-hidden="true">
          <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul id={listboxId} role="listbox" aria-labelledby={labelledBy} hidden={!isOpen} className="atlas-select__listbox">
        {options.map((option, index) => (
          <li
            id={`${listboxId}-option-${index}`}
            key={option.value}
            role="option"
            aria-selected={index === selectedIndex}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => chooseOption(index)}
            className={`atlas-select__option ${index === activeIndex ? 'is-active' : ''} ${index === selectedIndex ? 'is-selected' : ''}`}
          >
            <span>{option.label}</span>
            {index === selectedIndex ? <span className="atlas-select__check" aria-hidden="true">✓</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
