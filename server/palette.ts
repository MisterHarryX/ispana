import { DEFAULT_PALETTE, isPaletteId, type PaletteId } from '../shared/palette.js';
import { StorageUnavailableError, backend, dataPath, readJson, redis, writeJsonAtomic } from './store.js';

/**
 * The site palette chosen in the panel. Kept apart from the text edits, so saving texts
 * from the live editor can never reset it.
 */
const KEY = 'isp:palette';
const FILE = () => dataPath('palette.json');

export async function getPalette(): Promise<PaletteId> {
  const b = backend();
  if (b === 'none') return DEFAULT_PALETTE;
  try {
    const value = b === 'redis' ? await redis<string | null>(['GET', KEY]) : (await readJson<{ palette?: string }>(FILE(), {})).palette;
    return isPaletteId(value) ? value : DEFAULT_PALETTE;
  } catch (cause) {
    console.error('[palette] could not read', cause);
    return DEFAULT_PALETTE;
  }
}

export async function savePalette(palette: PaletteId): Promise<PaletteId> {
  const b = backend();
  if (b === 'none') throw new StorageUnavailableError('No storage configured');
  if (b === 'redis') await redis(['SET', KEY, palette]);
  else await writeJsonAtomic(FILE(), { palette, updatedAt: Date.now() });
  return palette;
}
