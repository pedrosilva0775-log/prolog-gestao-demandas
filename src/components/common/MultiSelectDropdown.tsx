import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type MultiSelectDropdownProps = {
  values: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  allLabel: string;
  ariaLabel: string;
  className?: string;
};

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  values,
  options,
  onChange,
  allLabel,
  ariaLabel,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const selectedLabel = useMemo(() => {
    if (!values.length) return allLabel;
    const labels = options.filter(option => values.includes(option.value)).map(option => option.label);
    if (labels.length <= 2) return labels.join(' e ');
    return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
  }, [allLabel, options, values]);

  const toggle = (value: string) => {
    onChange(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(previous => !previous)}
        className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs font-semibold text-slate-800 shadow-sm outline-none transition-all dark:text-slate-100 ${
          open
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 dark:bg-slate-800'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
        }`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          aria-multiselectable="true"
          className="absolute left-0 top-full z-[120] mt-1.5 max-h-72 w-full min-w-max overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/25 dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            type="button"
            role="option"
            aria-selected={!values.length}
            onClick={() => onChange([])}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${!values.length ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70'}`}
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${!values.length ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
              {!values.length && <Check className="h-3 w-3" />}
            </span>
            <span className="whitespace-nowrap">{allLabel}</span>
          </button>

          {options.map(option => {
            const selected = values.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(option.value)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${selected ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70'}`}
              >
                <span className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap">{option.label}</span>
                  {option.description && <span className="block text-[10px] font-normal text-slate-400">{option.description}</span>}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
