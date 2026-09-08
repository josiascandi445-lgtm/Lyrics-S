import type { VisualSettings } from '@/types';

export type EasingFn = (t: number) => number;

export const easings: Record<VisualSettings['easing'], EasingFn> = {
  linear: (t) => t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutQuint: (t) => 1 - Math.pow(1 - t, 5),
};

export function getEasing(name: VisualSettings['easing']): EasingFn {
  return easings[name] ?? easings.easeOutCubic;
}
