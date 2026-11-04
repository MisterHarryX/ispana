import { useState } from 'react';

/**
 * Which cards of a group are turned over. Cards never turn by themselves: only a resting
 * hover, a tap or the keyboard turns them. On touch screens one card is open at a time,
 * so a tap on the next card closes the previous one.
 */
export function useFlipTour(_count?: number, _inView?: boolean, _options?: unknown) {
  const [open, setOpen] = useState<Record<number, boolean>>({});
  const single = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
  const isFlipped = (i: number) => Boolean(open[i]);
  const set = (i: number, value: boolean) => setOpen((m) => (single && value ? { [i]: true } : { ...m, [i]: value }));
  return { isFlipped, set };
}
