import { Fragment, useDeferredValue, useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { site } from '../../config/site.ts';
import { spotlight } from '../../hooks/useTilt.ts';
import { contactHref } from '../../lib/contacts.ts';
import { formatPrice } from '../../lib/format.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { SERVICES_FILTER_EVENT } from './Topics.tsx';

/** Lower-case, ё→е, so «ресницы» finds «Реснички» and «еж» finds «ёж». */
const fold = (text: string) => text.toLowerCase().replace(/ё/g, 'е');

/** Search words people actually type, mapped to what the price list calls it. */
const SYNONYMS: Record<string, string> = {
  лазер: 'лазерн эпиляц',
  эпиляция: 'эпиляц депиляц',
  волосы: 'эпиляц депиляц',
  бикини: 'бикини',
  воск: 'восков депиляц',
  шугаринг: 'шугаринг депиляц',
  татуаж: 'перманент удален',
  тату: 'татуир татуаж удален',
  губы: 'губ',
  глаза: 'межресничк стрелк',
  лицо: 'лиц чистк уход пилинг',
  кожа: 'чистк уход пилинг ipl',
  акне: 'акне элос чистк',
  пигмент: 'пигментац ipl',
  омоложение: 'rf ipl лифтинг',
  массаж: 'сфера ems массаж',
  эндосфера: 'сфера',
  похудение: 'сфера ems',
  отеки: 'сфера ems лимфо',
  ресницы: 'ресниц',
  брови: 'бров',
};

/** Wraps every occurrence of the query words in <mark>. */
function highlight(text: string, words: string[]): ReactNode {
  if (!words.length) return text;
  const folded = fold(text);
  const ranges: [number, number][] = [];
  for (const w of words) {
    let from = 0;
    for (let at = folded.indexOf(w, from); at !== -1; at = folded.indexOf(w, from)) {
      ranges.push([at, at + w.length]);
      from = at + w.length;
    }
  }
  if (!ranges.length) return text;
  ranges.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = [];
  let pos = 0;
  ranges.forEach(([start, end], i) => {
    if (end <= pos) return;
    start = Math.max(start, pos);
    out.push(<Fragment key={`t${i}`}>{text.slice(pos, start)}</Fragment>, <mark key={`m${i}`}>{text.slice(start, end)}</mark>);
    pos = end;
  });
  out.push(<Fragment key="rest">{text.slice(pos)}</Fragment>);
  return out;
}

export function Services() {
  const { services, contacts } = site;
  const uid = useId();
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<string | null>(null);
  const deferred = useDeferredValue(query);
  useEffect(() => {
    const onFilter = (event: Event) => {
      setQuery('');
      setFormat((event as CustomEvent<string | null>).detail);
    };
    window.addEventListener(SERVICES_FILTER_EVENT, onFilter);
    return () => window.removeEventListener(SERVICES_FILTER_EVENT, onFilter);
  }, []);
  const phone = contacts.find((c) => c.kind === 'phone');

  const formats = useMemo(() => [...new Set(services.items.map((s) => s.format))], [services.items]);
  const words = useMemo(() => fold(deferred).split(/\s+/).filter((w) => w.length > 1), [deferred]);

  const shown = useMemo(
    () =>
      services.items.filter((s) => {
        if (format && s.format !== format) return false;
        if (!words.length) return true;
        const haystack = fold(`${s.title} ${s.summary} ${s.format}`);
        return words.every((w) => haystack.includes(w) || (SYNONYMS[w] ?? '').split(' ').some((alt) => alt && haystack.includes(alt)));
      }),
    [services.items, format, words],
  );

  const filterKey = `${format ?? 'all'}|${words.join(' ')}`;
  // Rows animate in on every filter change, but not on first load: there the scroll reveal leads.
  const touched = filterKey !== 'all|' || query !== '' || format !== null;

  return (
    <section id="services" className="section services" aria-labelledby="services-title">
      <div className="wrap">
        <SectionHeading id="services-title" title={services.title} lead={services.lead} className="services__heading" />

        <div className="price-finder" role="search">
          <label className="price-finder__search" htmlFor={`${uid}-q`}>
            <svg className="price-finder__lens" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
            <span className="visually-hidden">Найти услугу</span>
            <input
              id={`${uid}-q`}
              type="search"
              placeholder="Найти услугу: лазер, брови, чистка лица…"
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="price-finder__clear" onClick={() => setQuery('')} aria-label="Очистить поиск">
                ×
              </button>
            )}
          </label>

          <div className="price-finder__chips" role="group" aria-label="Направление">
            <button type="button" className="price-chip" aria-pressed={format === null} onClick={() => setFormat(null)}>
              Все <span>{services.items.length}</span>
            </button>
            {formats.map((f) => (
              <button key={f} type="button" className="price-chip" aria-pressed={format === f} onClick={() => setFormat(format === f ? null : f)}>
                {f} <span>{services.items.filter((s) => s.format === f).length}</span>
              </button>
            ))}
          </div>

          <p className="price-finder__count" role="status">
            {query || format ? `Найдено: ${shown.length}` : ''}
          </p>
        </div>

        <ul className="services__list" key={filterKey} data-filtered={touched || undefined}>
          {shown.map((service, i) => (
            <li
              key={service.id}
              className={`service${service.badge ? ' service--featured' : ''}`}
              style={{ '--n': Math.min(i, 8) } as CSSProperties}
              onPointerMove={spotlight}
            >
              <div className="service__about">
                <h3 id={`service-${service.id}`} className="service__title">
                  {highlight(service.title, words)}
                </h3>
                {service.badge && <p className="service__badge">{service.badge}</p>}
                <p className="service__summary">{highlight(service.summary, words)}</p>
              </div>
              <dl className="service__meta">
                <div>
                  <dt>Длительность</dt>
                  <dd>{service.duration}</dd>
                </div>
                <div>
                  <dt>Направление</dt>
                  <dd>{service.format}</dd>
                </div>
              </dl>
              <p className="service__price">
                <span className="visually-hidden">Стоимость: </span>
                {formatPrice(service.price)}
              </p>
              <BookingLink serviceId={service.id} variant={service.badge ? 'primary' : 'secondary'} ariaLabel={`Записаться: ${service.title}`}>
                Записаться
              </BookingLink>
            </li>
          ))}
        </ul>

        {shown.length === 0 && (
          <div className="price-finder__empty">
            <p>Такой услуги нет в основном прайсе — но, возможно, она есть в полном.</p>
            <p>
              {phone && (
                <a className="text-link" href={contactHref(phone)}>
                  Спросить администратора: {phone.value}
                </a>
              )}
            </p>
          </div>
        )}

        {services.note && <p className="services__note">{services.note}</p>}
      </div>
    </section>
  );
}
