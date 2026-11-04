import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { Slide } from '../../config/types.ts';
import { useInView } from '../../hooks/useInView.ts';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';

/** Index that moves on every `ms` while `active`; `offset` delays the first step. */
export function useCycle(length: number, ms: number, active: boolean, offset = 0) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active || length < 2) return;
    let timer = 0;
    const start = window.setTimeout(() => {
      setIndex((i) => (i + 1) % length);
      timer = window.setInterval(() => setIndex((i) => (i + 1) % length), ms);
    }, ms + offset);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer);
    };
  }, [active, length, ms, offset]);
  return [index, setIndex] as const;
}

/**
 * Photos stacked in one frame: the current one fades in over the last while it slowly
 * pushes in (Ken Burns). Pauses offscreen and under reduced motion.
 */
export function Crossfade({
  slides,
  ms = 5200,
  offset = 0,
  className = '',
  priority = false,
  sizes,
  showDots = false,
}: {
  slides: Slide[];
  ms?: number;
  offset?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  showDots?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduced = useReducedMotion();
  const [index, setIndex] = useCycle(slides.length, ms, inView && !reduced, offset);
  const [prev, setPrev] = useState(-1);
  const last = useRef(0);
  useEffect(() => {
    setPrev(last.current);
    last.current = index;
  }, [index]);

  return (
    <div ref={ref} className={`xfade ${className}`} style={{ '--xfade-ms': `${ms + 1200}ms` } as CSSProperties}>
      {slides.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={i === index ? slide.alt : ''}
          aria-hidden={i !== index}
          sizes={sizes}
          data-state={i === index ? 'on' : i === prev ? 'prev' : 'off'}
          loading={priority && i < 2 ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectPosition: slide.focus ?? '50% 50%' }}
        />
      ))}
      {showDots && slides.length > 1 && (
        <div className="xfade__dots" role="group" aria-label="Фото">
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Фото ${i + 1}: ${slide.alt}`}
              aria-current={i === index || undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** A word that keeps changing with a soft blur and a glowing gradient. */
export function GlowWord({ words, ms = 2600, className = '' }: { words: string[]; ms?: number; className?: string }) {
  const reduced = useReducedMotion();
  const [index] = useCycle(words.length, ms, !reduced, 900);
  return (
    <span className={`glow-word ${className}`}>
      <span className="visually-hidden">{words.join(', ')}</span>
      <span key={index} className="glow-word__text" aria-hidden="true">
        {words[index]}
      </span>
    </span>
  );
}

/** Counts the number inside `value` up from zero once it is on screen; keeps prefix, suffix and the decimal comma. */
export function CountUp({ value, ms = 1400 }: { value: string; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useOnce(ref);
  const reduced = useReducedMotion();
  const match = /^(\D*)(\d+(?:[.,]\d+)?)(.*)$/.exec(value);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!match || reduced || !seen) return;
    const [, pre, num, post] = match;
    const decimals = num.includes(',') || num.includes('.') ? num.split(/[.,]/)[1].length : 0;
    const target = Number(num.replace(',', '.'));
    let start = 0;
    let frame = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.max(0, Math.min(1, (now - start) / ms));
      const eased = 1 - Math.pow(1 - t, 3);
      const n = Math.abs(target * eased).toFixed(decimals).replace('.', ',');
      setShown(`${pre}${n}${post}`);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setShown(`${pre}${(0).toFixed(decimals).replace('.', ',')}${post}`);
    frame = requestAnimationFrame(tick);
    // Background tabs pause animation frames: never leave the figure stuck half-way.
    const done = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      setShown(value);
    }, ms + 400);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, reduced, value]);

  return (
    <span ref={ref} className="count-up">
      <span className="visually-hidden">{value}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** True from the first time the element comes into view. */
export function useOnce(ref: RefObject<Element | null>, rootMargin = '0px 0px -10% 0px') {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, seen]);
  return seen;
}
