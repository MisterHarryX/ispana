import { isEditable, TEXT_ROOTS } from '../../shared/content.ts';
import { cards } from '../config/cards.ts';
import type { SiteConfig } from '../config/types.ts';
import type { PublicContent } from './api.ts';

/**
 * The site config (and card texts) as written in code, captured before published edits
 * are applied, plus the edits themselves. The live editor needs both: "what is live" and
 * "what the code says" (for «Вернуть исходный»).
 */
let pristine: { site: SiteConfig; cards: typeof cards } | null = null;
let published: PublicContent | null = null;

export function rememberPristine(site: SiteConfig, content: PublicContent | null) {
  pristine = { site: structuredClone(site), cards: structuredClone(cards) };
  published = content;
}

export const getPristine = () => pristine;
export const getPublished = () => published;

/** Every editable text with its value, list indexes expanded ("faq.items.2.answer"). */
export function editableEntries(source: { site: SiteConfig; cards: typeof cards }): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const walk = (value: unknown, path: string[]) => {
    if (typeof value === 'string' || typeof value === 'number') {
      const key = path.join('.');
      if (isEditable(key) && String(value).trim()) out[key] = value;
      return;
    }
    if (Array.isArray(value)) value.forEach((item, i) => walk(item, [...path, String(i)]));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walk(v, [...path, k]);
  };
  for (const root of TEXT_ROOTS) walk(root === 'cards' ? source.cards : (source.site as unknown as Record<string, unknown>)[root], [root]);
  return out;
}
