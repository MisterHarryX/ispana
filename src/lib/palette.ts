import { useCallback, useSyncExternalStore } from 'react';

/** The colour palettes in styles/palettes.css. The first one is the default. */
export const PALETTES = [
  { id: 'powder', title: 'Пудра', swatch: ['#FBF7F5', '#E6CFC8', '#CE9C90', '#A5655E'] },
  { id: 'quartz', title: 'Розовый кварц', swatch: ['#FDF7F7', '#EDC6C3', '#D79C9C', '#AD5F66'] },
  { id: 'peach', title: 'Нюд и персик', swatch: ['#FDF8F4', '#EDCDC0', '#DDA791', '#B0665A'] },
  { id: 'milk', title: 'Молочный', swatch: ['#FCFAF9', '#EBD4CE', '#CE9C90', '#3B3537'] },
] as const;

export type PaletteId = (typeof PALETTES)[number]['id'];

const KEY = 'isp-palette';
const listeners = new Set<() => void>();
const read = (): PaletteId => (document.documentElement.dataset.palette as PaletteId) || 'powder';

function syncBar() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

export function applyPalette(id: PaletteId) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.dataset.palette = id;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* storage may be blocked: the palette still applies for this visit */
  }
  requestAnimationFrame(syncBar);
  window.setTimeout(() => root.classList.remove('theme-switching'), 450);
  listeners.forEach((l) => l());
}

export function usePalette() {
  const id = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => 'powder' as PaletteId,
  );
  const set = useCallback((next: PaletteId) => applyPalette(next), []);
  return { id, set };
}

/** The comparison panel is shown only on links with ?colors (or ?palette=…). */
export const paletteUiEnabled = () => document.documentElement.dataset.paletteUi === 'on';
