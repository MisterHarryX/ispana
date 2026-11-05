import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_PALETTE, isPaletteId, type PaletteId } from '../../shared/palette.ts';

export type { PaletteId };

/** The colour palettes in styles/palettes.css, in the order the panel shows them. */
export const PALETTES: { id: PaletteId; title: string; swatch: string[] }[] = [
  { id: 'milk', title: 'Молочный', swatch: ['#FCFAF9', '#EBD4CE', '#CE9C90', '#3B3537'] },
  { id: 'powder', title: 'Пудра', swatch: ['#FBF7F5', '#E6CFC8', '#CE9C90', '#A5655E'] },
  { id: 'quartz', title: 'Розовый кварц', swatch: ['#FDF7F7', '#EDC6C3', '#D79C9C', '#AD5F66'] },
  { id: 'peach', title: 'Нюд и персик', swatch: ['#FDF8F4', '#EDCDC0', '#DDA791', '#B0665A'] },
];

/** Last palette the site published, so the next visit paints in it straight away. */
const SITE_KEY = 'isp-palette-site';
const listeners = new Set<() => void>();
const read = (): PaletteId => {
  const id = document.documentElement.dataset.palette;
  return isPaletteId(id) ? id : DEFAULT_PALETTE;
};

function syncBar() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

/** Shows a palette on this page (no storage): the preview links and the comparison panel. */
export function applyPalette(id: PaletteId) {
  const root = document.documentElement;
  if (root.dataset.palette === id) return;
  root.classList.add('theme-switching');
  root.dataset.palette = id;
  requestAnimationFrame(syncBar);
  window.setTimeout(() => root.classList.remove('theme-switching'), 450);
  listeners.forEach((l) => l());
}

/** The palette the salon chose in the panel: applied unless a preview link asks for another, and remembered. */
export function adoptSitePalette(value: unknown) {
  if (!isPaletteId(value)) return;
  try {
    localStorage.setItem(SITE_KEY, value);
  } catch {
    /* storage may be blocked */
  }
  if (new URLSearchParams(location.search).has('palette')) return;
  applyPalette(value);
}

export function usePalette() {
  const id = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT_PALETTE,
  );
  const set = useCallback((next: PaletteId) => applyPalette(next), []);
  return { id, set };
}

/** The comparison panel is shown only on links with ?colors (or ?palette=…). */
export const paletteUiEnabled = () => document.documentElement.dataset.paletteUi === 'on';
