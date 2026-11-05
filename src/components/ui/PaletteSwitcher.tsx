import { useState, type CSSProperties } from 'react';
import { PALETTES, paletteUiEnabled, usePalette } from '../../lib/palette.ts';
import { useTheme } from '../../lib/theme.ts';

/**
 * A small floating panel to compare the colour palettes (and the light / dark theme) on the
 * live site. Shown only on links with ?colors, so visitors never see it.
 */
export function PaletteSwitcher() {
  const { id, set } = usePalette();
  const { mode, toggle } = useTheme();
  const [open, setOpen] = useState(true);
  if (!paletteUiEnabled()) return null;
  const current = PALETTES.find((p) => p.id === id) ?? PALETTES[0];

  return (
    <div className="isp-palette" data-open={open || undefined} role="region" aria-label="Выбор цветовой палитры">
      <button type="button" className="isp-palette__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="isp-palette__dots" aria-hidden="true">
          {current.swatch.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        <span>
          <small>Палитра</small>
          {current.title}
        </span>
        <b aria-hidden="true">{open ? '–' : '+'}</b>
      </button>
      {open && (
        <div className="isp-palette__body">
          <ul>
            {PALETTES.map((p, i) => (
              <li key={p.id}>
                <button type="button" aria-pressed={p.id === id} onClick={() => set(p.id)} style={{ '--i': i } as CSSProperties}>
                  <span className="isp-palette__strip" aria-hidden="true">
                    {p.swatch.map((c) => (
                      <i key={c} style={{ background: c }} />
                    ))}
                  </span>
                  <span className="isp-palette__name">
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    {p.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="isp-palette__theme" onClick={toggle}>
            {mode === 'dark' ? '☀ Светлая тема' : '☾ Тёмная тема'}
          </button>
        </div>
      )}
    </div>
  );
}
