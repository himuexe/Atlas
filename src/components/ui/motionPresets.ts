import type { Transition, Variants } from 'motion/react';

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export function pageTransition(reducedMotion: boolean | null): Transition {
  return reducedMotion !== false
    ? { duration: 0.01 }
    : { duration: 0.2, ease: [0.2, 0, 0, 1] };
}

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4, scale: 0.99 },
};

export function listItemTransition(reducedMotion: boolean | null): Transition {
  return reducedMotion !== false
    ? { duration: 0.01 }
    : { duration: 0.18, ease: [0.2, 0, 0, 1] };
}
