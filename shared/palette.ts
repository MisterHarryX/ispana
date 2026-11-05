/** Colour palettes of the site (styles/palettes.css). The first one is the default. */
export const PALETTE_IDS = ['milk', 'powder', 'quartz', 'peach'] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

export const DEFAULT_PALETTE: PaletteId = 'milk';

export const isPaletteId = (value: unknown): value is PaletteId => typeof value === 'string' && (PALETTE_IDS as readonly string[]).includes(value);
