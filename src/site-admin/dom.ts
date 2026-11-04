/**
 * DOM helpers for live text editing, ported from ICG. The page is React-rendered;
 * only text node values are touched, and a reload after publishing re-renders it cleanly.
 */

export const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

/** A config path, or one line of a multi-line text (rendered line by line). */
export interface TextRef {
  path: string;
  line?: number;
  /** The node shows a formatted price; the editor edits the bare amount. */
  price?: boolean;
}

const insideAdminUi = (node: Node) => Boolean(node.parentElement?.closest('[data-site-admin], script, style, noscript, title'));

/** Every text node on the page whose text equals `value` (whitespace-insensitive). */
export function findTextNodes(value: string): Text[] {
  const target = normalize(value);
  if (!target) return [];
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (normalize(node.nodeValue ?? '') === target && !insideAdminUi(node)) nodes.push(node as Text);
  }
  return nodes;
}

/** Replaces a node's text but keeps the whitespace JSX left around it. */
function setNodeText(node: Text, original: string, value: string) {
  const lead = /^\s*/.exec(original)?.[0] ?? '';
  const trail = /\s*$/.exec(original)?.[0] ?? '';
  node.nodeValue = `${lead}${value}${trail}`;
}

export type CapturedText = { node: Text; original: string }[];

/** Remembers the nodes showing `value` and their exact text, for preview and cancel. */
export const captureText = (value: string): CapturedText => findTextNodes(value).map((node) => ({ node, original: node.nodeValue ?? '' }));

export function previewText(captured: CapturedText, value: string) {
  for (const { node, original } of captured) setNodeText(node, original, value);
}

export function restoreText(captured: CapturedText) {
  for (const { node, original } of captured) node.nodeValue = original;
}

/** Swaps every on-page occurrence of `from` for `to`. */
export function replaceOnPage(from: string, to: string) {
  for (const node of findTextNodes(from)) setNodeText(node, node.nodeValue ?? '', to);
}

type CaretDocument = Document & {
  caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

/** The text node actually under the pointer (not merely the nearest caret position). */
export function textNodeAt(x: number, y: number): Text | null {
  const doc = document as CaretDocument;
  const node = doc.caretPositionFromPoint ? doc.caretPositionFromPoint(x, y)?.offsetNode : doc.caretRangeFromPoint?.(x, y)?.startContainer;
  if (!node || node.nodeType !== Node.TEXT_NODE || insideAdminUi(node)) return null;
  const range = document.createRange();
  range.selectNodeContents(node);
  for (const rect of range.getClientRects()) {
    if (x >= rect.left - 2 && x <= rect.right + 2 && y >= rect.top - 2 && y <= rect.bottom + 2) return node as Text;
  }
  return null;
}

export function textRect(node: Text) {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect();
}

export const SECTION_LABELS: Record<string, string> = {
  hero: 'Первый экран',
  practitioner: 'О салоне',
  topics: 'Услуги',
  team: 'Команда',
  marquee: 'Бегущая строка',
  services: 'Цены',
  promos: 'Акции',
  works: 'Работы',
  process: 'Как проходит визит',
  testimonials: 'Отзывы',
  faq: 'Вопросы',
  booking: 'Запись',
  location: 'Как нас найти',
  address: 'Адрес',
  footer: 'Подвал',
  cards: 'Работы',
};

export const sectionLabel = (path: string) => SECTION_LABELS[path.split('.')[0]] ?? path.split('.')[0];

/** Human names for paths, shown in the editor instead of "services.items.1.summary". */
export function pathLabel(path: string) {
  const parts = path.split('.');
  const last = parts[parts.length - 1];
  const names: Record<string, string> = {
    handNote: 'строка над заголовком',
    headline: 'заголовок',
    lead: 'подзаголовок',
    note: 'примечание',
    primaryAction: 'кнопка',
    secondaryAction: 'вторая ссылка',
    name: 'имя',
    role: 'роль',
    aboutTitle: 'заголовок раздела',
    expectationsTitle: 'заголовок списка',
    title: 'заголовок',
    summary: 'описание',
    duration: 'длительность',
    format: 'формат',
    amount: 'цена',
    question: 'вопрос',
    answer: 'ответ',
    privacyNote: 'о личных данных',
    text: 'текст',
    meaning: 'описание',
    reading: 'идея',
    reflection: 'вопрос',
    word: 'слово',
    alt: 'описание фото',
    badge: 'плашка',
    disclaimer: 'пояснение',
    prompt: 'подсказка',
    greeting: 'приветствие',
    closingNote: 'итоговая карточка',
    numeral: 'категория',
    context: 'подпись',
    disclaimerText: 'пояснение',
  };
  const label = names[last] ?? (/^\d+$/.test(last) ? `пункт ${Number(last) + 1}` : last);
  if (parts[0] === 'cards') return `работа «${parts[1]}» · ${label}`;
  const index = parts.findIndex((p) => /^\d+$/.test(p));
  if (index > 0 && index < parts.length - 1) {
    const list = parts[index - 1];
    const noun = list === 'readings' ? 'идея' : parts[0] === 'team' ? 'мастер' : parts[0] === 'services' ? 'услуга' : parts[0] === 'faq' ? 'вопрос' : parts[0] === 'process' ? 'шаг' : 'пункт';
    return `${noun} ${Number(parts[index]) + 1} · ${label}`;
  }
  if (parts[1] === 'intro') return `абзац ${Number(last) + 1}`;
  return label;
}
