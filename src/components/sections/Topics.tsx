import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { site } from '../../config/site.ts';
import { useInView } from '../../hooks/useInView.ts';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { Drawing, type DrawingId } from '../art/Drawings.tsx';
import { useCycle } from '../ui/Motion.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';

/** Filters the price list to a direction and scrolls to it (Services listens for this event). */
export const SERVICES_FILTER_EVENT = 'isp:services-filter';

function showPrices(format?: string) {
  window.dispatchEvent(new CustomEvent(SERVICES_FILTER_EVENT, { detail: format ?? null }));
  document.getElementById('services')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

const STEP_MS = 5000;

/** Masters named in a topic, matched to the team for their portraits. */
function mastersOf(names?: string) {
  if (!names) return [];
  return names
    .split(',')
    .map((n) => n.trim())
    .map((name) => site.team.items.find((m) => m.name === name) ?? { id: name, name, photo: undefined });
}

/**
 * Directions as a showcase: a list on the left, a large arched photo of the chosen one on the
 * right with its text, price and masters. It moves on by itself until the visitor picks one.
 */
export function Topics() {
  const { topics } = site;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-20% 0px');
  const reduced = useReducedMotion();
  const [touched, setTouched] = useState(true);
  const [active, setActive] = useCycle(topics.items.length, STEP_MS, inView && !reduced && !touched);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const topic = topics.items[active];

  // On phones the tabs are a sideways strip: keep the chosen one in view without moving the page.
  useEffect(() => {
    const list = listRef.current;
    const tab = tabs.current[active];
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [active, reduced]);

  const pick = (i: number, focus = false) => {
    setTouched(true);
    setActive(i);
    if (focus) tabs.current[i]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const n = topics.items.length;
    const map: Record<string, number> = { ArrowDown: (active + 1) % n, ArrowRight: (active + 1) % n, ArrowUp: (active - 1 + n) % n, ArrowLeft: (active - 1 + n) % n, Home: 0, End: n - 1 };
    if (e.key in map) {
      e.preventDefault();
      pick(map[e.key], true);
    }
  };

  return (
    <section id="topics" className="section isp-topics" aria-labelledby="topics-title">
      <div className="wrap">
        <SectionHeading id="topics-title" title={topics.title} lead={topics.lead} className="isp-heading--center" />

        <div ref={ref} className="isp-show isp-reveal" data-playing={!touched && !reduced}>
          <div ref={listRef} className="isp-show__list" role="tablist" aria-label="Направления" aria-orientation="vertical" onKeyDown={onKey}>
            {topics.items.map((t, i) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`topic-tab-${t.id}`}
                aria-selected={i === active}
                aria-controls="topic-panel"
                tabIndex={i === active ? 0 : -1}
                className="isp-show__tab"
                onClick={() => pick(i)}
                onPointerEnter={(e) => e.pointerType === 'mouse' && pick(i)}
              >
                <span className="isp-show__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="isp-show__name">{t.title}</span>
                {t.from && <span className="isp-show__from">от {t.from}</span>}
                <span className="isp-show__bar" aria-hidden="true">
                  <span key={`${active}-${touched}`} style={{ animationDuration: `${STEP_MS}ms` }} />
                </span>
              </button>
            ))}
          </div>

          <div className="isp-show__panel" id="topic-panel" role="tabpanel" aria-labelledby={`topic-tab-${topic.id}`}>
            <div className="isp-show__media isp-show__media--art">
              <span className="isp-show__halo" aria-hidden="true" />
              <Drawing key={topic.id} id={topic.drawing as DrawingId} active label={topic.title} className="isp-show__art" />
              <span className="isp-show__index" aria-hidden="true">
                {String(active + 1).padStart(2, '0')}
                <small>/ {String(topics.items.length).padStart(2, '0')}</small>
              </span>
            </div>

            <div className="isp-show__card" key={topic.id}>
              <h3>{topic.title}</h3>
              <p>{topic.text}</p>
              <div className="isp-show__meta">
                <ul className="isp-show__masters" aria-label="Мастера">
                  {mastersOf(topic.masters).map((m, i) => (
                    <li key={m.id} style={{ '--i': i } as CSSProperties} title={m.name}>
                      {m.photo ? <img src={m.photo} alt={m.name} width={44} height={55} loading="lazy" /> : <span>{m.name[0]}</span>}
                    </li>
                  ))}
                </ul>
                {topic.from && (
                  <p className="isp-show__price">
                    <small>от</small> {topic.from}
                  </p>
                )}
              </div>
              <div className="isp-show__actions">
                <BookingLink className="btn--compact">Записаться</BookingLink>
                <a
                  className="btn btn--secondary btn--compact"
                  href="#services"
                  onClick={(event) => {
                    event.preventDefault();
                    showPrices(topic.format);
                  }}
                >
                  Все цены
                </a>
              </div>
            </div>
          </div>
        </div>

        {topics.closingNote && (
          <div className="isp-topics__note isp-reveal">
            <p>{topics.closingNote}</p>
            <BookingLink variant="link">Записаться на консультацию</BookingLink>
          </div>
        )}
      </div>
    </section>
  );
}
