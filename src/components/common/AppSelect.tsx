import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { dropdownVariants } from '../motion/presets';

type OptionData = { value: string; label: string; disabled: boolean };

type AppSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'multiple'> & {
  children: React.ReactNode;
};

const readOptions = (children: React.ReactNode): OptionData[] => {
  const options: OptionData[] = [];
  const visit = (nodes: React.ReactNode) => React.Children.forEach(nodes, child => {
    if (!React.isValidElement(child)) return;
    if (child.type === 'option') {
      const props = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
      options.push({
        value: String(props.value ?? ''),
        label: React.Children.toArray(props.children).join(''),
        disabled: Boolean(props.disabled),
      });
      return;
    }
    visit((child.props as { children?: React.ReactNode }).children);
  });
  visit(children);
  return options;
};

export const AppSelect: React.FC<AppSelectProps> = ({
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  className = '',
  id,
  name,
  'aria-label': ariaLabel,
  title,
}) => {
  const options = useMemo(() => readOptions(children), [children]);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? options[0]?.value ?? ''));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const currentValue = controlled ? String(value ?? '') : internalValue;
  const selected = options.find(option => option.value === currentValue) ?? options[0];

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

  const choose = (nextValue: string) => {
    const target = { value: nextValue, name: name ?? '', id: id ?? '' } as EventTarget & HTMLSelectElement;
    onChange?.({ target, currentTarget: target } as React.ChangeEvent<HTMLSelectElement>);
    if (!controlled) setInternalValue(target.value);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        id={id}
        type="button"
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(previous => !previous)}
        className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-xs font-semibold text-slate-800 shadow-sm outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-100 ${
          open
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 dark:bg-slate-800'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
        } ${className}`}
      >
        <span className={`truncate ${!currentValue ? 'text-slate-400' : ''}`}>{selected?.label ?? 'Selecione'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180 text-blue-500' : ''}`} />
      </button>

      <AnimatePresence>
      {open && !disabled && (
        <motion.div
          variants={reduceMotion ? undefined : dropdownVariants}
          initial={reduceMotion ? false : 'closed'}
          animate="open"
          exit="closed"
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full z-[120] mt-1.5 max-h-64 w-full min-w-max origin-top overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/25 dark:border-slate-700 dark:bg-slate-800"
        >
          {options.map(option => {
            const active = option.value === currentValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                disabled={option.disabled}
                onClick={() => choose(option.value)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors disabled:opacity-40 ${active ? 'bg-blue-50 font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/70'}`}
              >
                <span className="flex-1 whitespace-nowrap">{option.label}</span>
                <Check className={`h-4 w-4 shrink-0 text-blue-500 ${active ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
