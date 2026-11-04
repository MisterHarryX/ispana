import { useMemo, useRef, useState, type CSSProperties } from 'react';
import type { WorkPhoto } from '../../config/types.ts';
import { site } from '../../config/site.ts';
import { useInView } from '../../hooks/useInView.ts';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';
import { useImageViewer } from '../ui/ImageViewer.tsx';
import { useCycle } from '../ui/Motion.tsx';
import { FlipCard } from '../ui/FlipCard.tsx';
import { Drawing, type DrawingId } from '../art/Drawings.tsx';
import { useFlipTour } from '../../hooks/useFlipTour.ts';
import { SectionHeading } from '../ui/SectionHeading.tsx';

const big = (p: WorkPhoto) => `${p.src}-${p.widths[p.widths.length - 1]}.webp`;
const small = (p: WorkPhoto) => `${p.src}-${p.widths[0]}.webp`;

/**
 * Portfolio that always fits one screen: a large photo shown whole (on a blurred copy of
 * itself, so nothing is cut and nothing is empty) beside an even 4×3 grid of every work.
 * The filter dims the other works instead of removing them, so the grid stays full.
 */
function Portfolio() {
  const { works } = site;
  const items = works.items;
  const open = useImageViewer();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-25% 0px');
  const reduced = useReducedMotion();
  const [category, setCategory] = useState<string | null>(null);
  const [touched, setTouched] = useState(true);
  const categories = useMemo(() => [...new Set(items.map((w) => w.category))], [items]);
  const pool = useMemo(() => items.map((w, i) => ({ w, i })).filter(({ w }) => !category || w.category === category), [items, category]);
  const [step, setStep] = useCycle(pool.length, 4800, inView && !reduced && !touched);
  const current = pool[step % pool.length] ?? pool[0];

  const show = (index: number) => {
    setTouched(true);
    const at = pool.findIndex((p) => p.i === index);
    if (at >= 0) setStep(at);
    else {
      setCategory(null);
      setStep(index);
    }
  };
  const move = (delta: number) => {
    setTouched(true);
    setStep((step + delta + pool.length) % pool.length);
  };
  const filter = (c: string | null) => {
    setTouched(true);
    setCategory(c);
    setStep(0);
  };

  return (
    <div ref={ref} className="isp-folio">
      <div className="isp-folio__filters" role="group" aria-label="Показать работы">
        <button type="button" className="isp-chip" aria-pressed={category === null} onClick={() => filter(null)}>
          Все <small>{items.length}</small>
        </button>
        {categories.map((c) => (
          <button key={c} type="button" className="isp-chip" aria-pressed={category === c} onClick={() => filter(category === c ? null : c)}>
            {c} <small>{items.filter((w) => w.category === c).length}</small>
          </button>
        ))}
      </div>

      <div className="isp-folio__stage">
        <figure className="isp-folio__main">
          <button type="button" className="isp-folio__view" onClick={() => open(items.map((w) => ({ src: big(w), title: w.title, description: w.category })), current.i)} aria-label={`Открыть на весь экран: ${current.w.title}`}>
            {items.map((w, i) => (
              <span key={w.id} className="isp-folio__layer" data-on={i === current.i || undefined} aria-hidden={i !== current.i}>
                <img className="isp-folio__blur" src={small(w)} alt="" loading="lazy" decoding="async" />
                <img className="isp-folio__img" src={big(w)} alt={i === current.i ? w.title : ''} loading="lazy" decoding="async" />
              </span>
            ))}
          </button>
          <figcaption className="isp-folio__caption" key={current.w.id}>
            <small>{current.w.category}</small>
            <span>{current.w.title}</span>
          </figcaption>
          <div className="isp-folio__nav">
            <button type="button" onClick={() => move(-1)} aria-label="Предыдущая работа">
              ←
            </button>
            <span>
              {String(step + 1).padStart(2, '0')} / {String(pool.length).padStart(2, '0')}
            </span>
            <button type="button" onClick={() => move(1)} aria-label="Следующая работа">
              →
            </button>
          </div>
          {!touched && !reduced && (
            <span className="isp-folio__timer" aria-hidden="true">
              <span key={step} />
            </span>
          )}
        </figure>

        <ul className="isp-folio__grid">
          {items.map((w, i) => {
            const dim = category !== null && w.category !== category;
            return (
              <li key={w.id} style={{ '--i': i } as CSSProperties}>
                <button
                  type="button"
                  className="isp-folio__thumb"
                  data-active={i === current.i || undefined}
                  data-dim={dim || undefined}
                  onClick={() => show(i)}
                  aria-label={w.title}
                  aria-pressed={i === current.i}
                >
                  <img src={small(w)} alt="" loading="lazy" decoding="async" style={{ objectPosition: w.focus ?? '50% 50%' }} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** The salon's rooms as arched cards that turn over to what happens in each one. */
function Interior() {
  const { works } = site;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-20% 0px');
  const { isFlipped, set } = useFlipTour(works.interior.length, inView, { every: 3200, hold: 1800 });
  if (!works.interior.length) return null;
  return (
    <div ref={ref} className="isp-rooms isp-reveal">
      <div className="isp-rooms__head">
        <h3 className="isp-rooms__title">{works.interiorTitle}</h3>
        <p>Переверните карточку — расскажем, что происходит в каждом кабинете.</p>
      </div>
      <ul className="isp-rooms__grid">
        {works.interior.map((room, i) => (
          <li key={room.id} style={{ '--i': i } as CSSProperties}>
            <FlipCard
              className="isp-room"
              label={room.title}
              flipped={isFlipped(i)}
              onFlip={(v) => set(i, v)}
              front={
                <>
                  <img src={big(room)} alt={room.title} loading="lazy" decoding="async" style={{ objectPosition: room.focus ?? '50% 50%' }} />
                  <span className="isp-room__label">
                    <small>{String(i + 1).padStart(2, '0')}</small>
                    {room.title}
                  </span>
                </>
              }
              back={
                <div className="isp-room__back">
                  {room.drawing && <Drawing id={room.drawing as DrawingId} active={isFlipped(i)} />}
                  <strong>{room.title}</strong>
                  {room.text && <p>{room.text}</p>}
                  {room.tags && (
                    <ul>
                      {room.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                </div>
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Works() {
  const { works } = site;
  return (
    <section id="works" className="section isp-works" aria-labelledby="works-title">
      <div className="wrap">
        <SectionHeading id="works-title" title={works.title} lead={works.lead} className="isp-heading--center isp-heading--tight" />
        <Portfolio />
        <Interior />
      </div>
    </section>
  );
}
