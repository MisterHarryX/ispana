/**
 * Content model for the ISPANA salon site.
 *
 * Public copy lives in `site.ts`, photographs and their crops in `photos.ts`.
 * Anything marked `sample: true` is development placeholder content: it is
 * reported by `npm run check:content`.
 */

import type { CardId } from './cards.ts';

export type { CardId };

/** `draft` keeps the page out of search engines; `published` marks it indexable. */
export type SiteStatus = 'draft' | 'published';

export interface ThemeColors {
  /** Page background — warm white. */
  background: string;
  /** Raised surfaces: cards, panels, alternate sections — soft beige. */
  surface: string;
  /** Secondary accent (taupe). */
  amethyst: string;
  /** Soft pink accent for fills and glows. */
  rose: string;
  /** Primary buttons, links and fine lines — dusty rose. */
  gold: string;
  /** Main text colour — warm cocoa. */
  ivory: string;
}

export interface SiteMeta {
  status: SiteStatus;
  title: string;
  description: string;
  /** Absolute production URL, used for the canonical link. Leave empty until known. */
  url?: string;
  brand: string;
}

export interface PhotoCredit {
  author: string;
  /** Page the photo was taken from. */
  url: string;
  license: string;
}

/**
 * A locally stored photograph. Files follow `${src}-${width}.${format}`,
 * one file per entry in `widths`.
 */
export interface Photo {
  src: string;
  widths: number[];
  format: 'webp' | 'jpg';
  /** Intrinsic size of the largest file; keeps layout stable while loading. */
  width: number;
  height: number;
  alt: string;
  /** CSS object-position — the focal point kept in every crop. */
  focus: string;
  credit: PhotoCredit;
}

export type PhotoId = 'entrance' | 'cheer' | 'group' | 'doorway' | 'line' | 'reception';

export interface Portrait {
  /** Path inside `/public`. `null` leaves an empty image frame in its place. */
  src: string | null;
  alt: string;
  width?: number;
  height?: number;
  /** object-position for the portrait crop. */
  focus?: string;
}

export interface Credential {
  label: string;
  value: string;
}

export interface Practitioner {
  name: string;
  /** Short role line, e.g. «салон красоты». */
  role: string;
  portrait: Portrait;
  /** Small label above the title. */
  eyebrow: string;
  aboutTitle: string;
  intro: string[];
  /** Short lead-in plus explanation. */
  approach: { lead: string; text: string }[];
  expectationsTitle: string;
  expectations: string[];
  /** Figures. Rendered only when supplied — never invent figures. */
  credentials: Credential[];
  /** Fanned photo cards beside the text; each turns over to a fact. */
  cards: FlipCard[];
  sample?: boolean;
}

export interface HeroContent {
  /** Two short lines split by "\n"; wrap words in *asterisks* for the pink italic accent. */
  headline: string;
  /** Short label above the headline. */
  handNote: string;
  /** Phrases that take turns in the *accent* slot; keep each no longer than the first. */
  accents?: string[];
  /** Lead text: `lead` + a glowing word that keeps changing (`leadWords`) + `leadEnd`. */
  lead: string;
  leadWords: string[];
  leadEnd: string;
  primaryAction: string;
  secondaryAction: string;
  note: string;
  /** Three figures under the buttons. */
  stats: Credential[];
  /** Photos that cross-fade in the large arch and in the round inset. */
  slides: Slide[];
  insetSlides: Slide[];
}

export interface Slide {
  src: string;
  alt: string;
  focus?: string;
}

export interface Topic {
  id: string;
  title: string;
  text: string;
  /** Lowest price, shown as «от …». */
  from?: string;
  /** Masters who do it, shown under the text. */
  masters?: string;
  /** Price-list direction (`services.items[].format`) the card filters to. */
  format?: string;
  /** Line illustration shown in the showcase (an id from components/art/Drawings.tsx). */
  drawing: string;
}

export interface Price {
  amount: number;
  currency: string;
  prefix?: string;
}

export interface Service {
  id: string;
  title: string;
  summary: string;
  duration: string;
  /** Session length for the slot picker; leave out for formats without a live meeting. */
  minutes?: number;
  format: string;
  price: Price;
  /** Optional short note, e.g. «Спеццена». Avoid unverifiable claims. */
  badge?: string;
  /** Marks the price as a development sample. */
  sample?: boolean;
}

export interface ProcessStep {
  title: string;
  text: string;
  /** Line illustration id from components/art/Drawings.tsx. */
  drawing: string;
}

/** A portfolio or interior photo: files are `${src}-${w}.webp` for each width. */
export interface WorkPhoto {
  id: string;
  title: string;
  /** Filter chip the photo belongs to, e.g. «Брови». */
  category: string;
  src: string;
  widths: number[];
  width: number;
  height: number;
  /** CSS object-position for the 4:5 tile. */
  focus?: string;
  /** Back of a flip card: a few words, what is done there, and a drawing id. */
  text?: string;
  tags?: string[];
  drawing?: string;
}

/** A photo card that turns over to a short fact. */
export interface FlipCard {
  /** Photo on the front; leave out and set `frontDrawing` for a drawn front. */
  src?: string;
  frontDrawing?: string;
  alt: string;
  focus?: string;
  title: string;
  text: string;
  drawing: string;
}

export interface Promo {
  title: string;
  text: string;
  /** Large figure, e.g. «6 200 ₽» or «−15%». */
  value: string;
  /** Small print under the card, e.g. the old price or the terms. */
  note?: string;
  /** Service the «Записаться» button preselects. */
  serviceId?: string;
  /** Small label on the card, e.g. «Хит». */
  tag?: string;
}

export interface Testimonial {
  name: string;
  context?: string;
  text: string;
  /** When it was written, as shown on the review site, e.g. «апрель 2026». */
  date?: string;
  /** Development example. Sample testimonials never render. */
  sample?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export type ContactKind = 'phone' | 'telegram' | 'whatsapp' | 'email' | 'booking' | 'vk' | 'max';

export interface ContactMethod {
  kind: ContactKind;
  /**
   * phone: number in international format · telegram: username without @ · whatsapp: phone in international format ·
   * email: address · booking: absolute URL of an external booking service ·
   * vk, max: absolute URL of the community or chat.
   */
  value: string;
  label?: string;
  sample?: boolean;
}

export interface Master {
  id: string;
  name: string;
  /** Title as the salon gives it, e.g. «ТОП-мастер по лазерной эпиляции». */
  role: string;
  /** What the master does, as short items. */
  services: string[];
  /** Path inside `/public`; masters without a photo get the monogram. */
  photo?: string;
  /** Kept for the shared booking dialog; no work cards on this site. */
  card?: CardId;
  /** Price-list directions (`services.items[].format`) this master can be booked for online. */
  formats?: string[];
}

export interface SectionCopy {
  title: string;
  lead?: string;
}

export interface Location extends SectionCopy {
  /** Organisation ID on Yandex Maps (the number in yandex.ru/maps/org/…/<id>/). */
  orgId: string;
  /** Point on the map, WGS-84. */
  lat: number;
  lon: number;
  /** Opening hours as rows, e.g. { days: 'Ежедневно', time: '10:00–21:00' }. */
  hours: { days: string; time: string }[];
  /** How to get there: short lines under the address. */
  directions: string[];
  /** Amenities from the Yandex Maps card: parking, Wi-Fi… */
  features: string[];
  /** Figures copied from the Yandex Maps card; update them by hand when they change. */
  rating: { value: string; votes: string; reviews: string; award?: string };
}

export interface SiteConfig {
  meta: SiteMeta;
  theme: ThemeColors;
  sections: {
    about: boolean;
    topics: boolean;
    team: boolean;
    services: boolean;
    promos: boolean;
    works: boolean;
    process: boolean;
    testimonials: boolean;
    faq: boolean;
    location: boolean;
  };
  practitioner: Practitioner;
  hero: HeroContent;
  topics: SectionCopy & { items: Topic[]; closingNote?: string };
  team: SectionCopy & { items: Master[]; note?: string };
  /** Moving band of procedure names. */
  marquee: { words: string[] };
  services: SectionCopy & { items: Service[]; note?: string };
  promos: SectionCopy & { items: Promo[]; note?: string };
  works: SectionCopy & { items: WorkPhoto[]; interiorTitle: string; interior: WorkPhoto[] };
  process: SectionCopy & { steps: ProcessStep[] };
  testimonials: SectionCopy & {
    items: Testimonial[];
    /** «Что хвалят» from the Yandex Maps card: share of positive mentions per aspect. */
    aspects?: { label: string; percent: number; reviews: string }[];
  };
  faq: SectionCopy & { items: FaqItem[] };
  booking: SectionCopy & {
    /** First line of the pre-filled message a visitor sends. */
    greeting: string;
    privacyNote: string;
  };
  contacts: ContactMethod[];
  /** Where the salon is: shown in the booking section and the footer. */
  address: { line: string; note?: string; mapUrl: string };
  /** «Как нас найти»: the Yandex Maps card of the salon, embedded with its rating and reviews. */
  location: Location;
  footer: { note: string; motto: string; disclaimer: string };
}
