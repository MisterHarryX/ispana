import { useCallback, useSyncExternalStore } from 'react';

export type ThemeMode = 'light' | 'dark';

const KEY = 'isp-theme';
const BAR = { light: '#FBF3F0', dark: '#2A191D' } as const;

const read = (): ThemeMode => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Applies a mode to <html>, the browser bar colour and storage (the inline script in index.html sets it before paint). */
export function applyTheme(mode: ThemeMode, remember = true) {
  const root = document.documentElement;
  // A short class lets colours cross-fade instead of snapping.
  root.classList.add('theme-switching');
  root.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[mode]);
  if (remember) {
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      /* storage may be blocked; the mode still applies for this visit */
    }
  }
  window.setTimeout(() => root.classList.remove('theme-switching'), 450);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const mode = useSyncExternalStore(subscribe, read, () => 'light' as ThemeMode);
  const toggle = useCallback(() => applyTheme(read() === 'dark' ? 'light' : 'dark'), []);
  return { mode, toggle };
}
