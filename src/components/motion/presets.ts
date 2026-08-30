import type { Transition, Variants } from 'framer-motion';

export const MOTION_EASE = [0.4, 0, 0.2, 1] as const;
export const MOTION_EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const transitions = {
  micro: { duration: 0.16, ease: MOTION_EASE } satisfies Transition,
  dropdown: { duration: 0.18, ease: MOTION_EASE_OUT } satisfies Transition,
  page: { duration: 0.28, ease: MOTION_EASE_OUT } satisfies Transition,
  settle: { type: 'spring', stiffness: 420, damping: 28, mass: 0.75 } satisfies Transition,
};

export const dropdownVariants: Variants = {
  closed: { opacity: 0, y: -8, scale: 0.985, transition: transitions.dropdown },
  open: { opacity: 1, y: 0, scale: 1, transition: transitions.dropdown },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16, ease: MOTION_EASE } },
};

export const staggerContainer = (delayChildren = 0.05, staggerChildren = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { delayChildren, staggerChildren } },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transitions.page },
};
