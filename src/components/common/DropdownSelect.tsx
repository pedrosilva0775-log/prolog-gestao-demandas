import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { dropdownVariants } from '../motion/presets';

type DropdownOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

type DropdownSelectProps<T extends string> = {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
};

export function DropdownSelect<T extends string>({ value, options, onChange, ariaLabel, className = '' }: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(previous => !previous)}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-left text-xs font-bold transition-all ${
          open
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 dark:bg-slate-800'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-800/80'
        } text-slate-800 shadow-sm dark:text-slate-100`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          variants={reduceMotion ? undefined : dropdownVariants}
          initial={reduceMotion ? false : 'closed'}
          animate="open"
          exit="closed"
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-50 mt-2 w-full min-w-max origin-top overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-800"
        >
          {options.map(option => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                  isSelected
                    ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block whitespace-nowrap">{option.label}</span>
                  {option.description && <span className="mt-0.5 block text-[10px] font-normal text-slate-400">{option.description}</span>}
                </span>
                <Check className={`h-4 w-4 shrink-0 text-blue-500 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
