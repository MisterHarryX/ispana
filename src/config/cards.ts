/**
 * Work cards (portfolio photos). ISPANA has none on the site yet, so the registry is empty;
 * the live editor and the booking dialog still read it, so the module stays.
 * To add portfolio photos later, put 600×800 JPEGs into public/cards and list them here.
 */
export type CardId = string;

export interface WorkCardInfo {
  id: CardId;
  title: string;
  /** Short category label shown above the title. */
  numeral: string;
  src: string;
  width: number;
  height: number;
  keywords: string[];
  /** One or two short sentences about the procedure. */
  meaning: string;
}

export const cards: Record<CardId, WorkCardInfo> = {};
