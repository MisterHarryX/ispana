import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { useParallax } from '../../hooks/useCursorGlow.ts';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { CountUp, Crossfade, GlowWord } from '../ui/Motion.tsx';

const order = (i: number) => ({ '--i': i }) as CSSProperties;

const ACCENT_MS = 3600;

/** The italic accent word, which softly changes. Screen readers get the first phrase only. */
function Accent({ phrases }: { phrases: string[] }) {
  const [state, setState] = useState({ index: 0, prev: -1 });
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || phrases.length < 2) return;
    const timer = window.setInterval(
      () => setState(({ index }) => ({ index: (index + 1) % phrases.length, prev: index })),
      ACCENT_MS,
    );
    return () => window.clearInterval(timer);
  }, [reduced, phrases.length]);

  return (
    <em className="accent">
      <span className="visually-hidden">{phrases[0]}</span>
      <span className="accent__stack" aria-hidden="true">
        {phrases.map((phrase, i) => (
          <span
            key={phrase}
            className="accent__phrase"
            data-state={i === state.index ? 'in' : i === state.prev ? 'out' : 'idle'}
            data-first={state.prev === -1 || undefined}
          >
            {[...phrase].map((char, j) => (
              <span key={j} className="accent__char" style={{ '--j': j } as CSSProperties}>
                {char === ' ' ? ' ' : char}
              </span>
            ))}
          </span>
        ))}
      </span>
    </em>
  );
}

/** Headline lines split on "\n"; the *starred* part is the rotating accent. */
function Headline({ text, accents = [] }: { text: string; accents?: string[] }) {
  return text.split('\n').map((line, i) => (
    <span key={i} className="isp-hero__line" style={order(i)}>
      <span>
        {line.split('*').map((part, j) =>
          j % 2 ? <Accent key={j} phrases={[part, ...accents.filter((a) => a !== part)]} /> : <Fragment key={j}>{part}</Fragment>,
        )}
      </span>
    </span>
  ));
}

/** Soft petals that drift up through the hero. */
function Petals() {
  return (
    <span className="isp-petals" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <i key={i} style={{ '--p': i } as CSSProperties} />
      ))}
    </span>
  );
}

/** Small four-point stars that drift around the arch. */
function Sparkles() {
  return (
    <span className="isp-sparkles" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" style={{ '--s': i } as CSSProperties}>
          <path d="M12 1.5l2 7.5 7.5 2-7.5 2-2 7.5-2-7.5-7.5-2 7.5-2z" />
        </svg>
      ))}
    </span>
  );
}

export function Hero() {
  const { hero, location } = site;
  const ref = useRef<HTMLElement>(null);
  useParallax(ref);

  return (
    <section ref={ref} className="isp-hero" aria-labelledby="hero-title">
      <span className="isp-hero__glow" aria-hidden="true" />
      <span className="isp-hero__glow isp-hero__glow--2" aria-hidden="true" />
      <Petals />
      <div className="wrap isp-hero__grid">
        <div className="isp-hero__text">
          <p className="isp-eyebrow enter" style={order(0)}>
            {hero.handNote}
          </p>
          <h1 id="hero-title" className="isp-hero__title">
            <Headline text={hero.headline} accents={hero.accents} />
          </h1>
          <p className="isp-hero__lead enter" style={order(3)}>
            {hero.lead} <GlowWord words={hero.leadWords} /> {hero.leadEnd}
          </p>
          <div className="isp-hero__actions enter" style={order(4)}>
            <BookingLink className="btn--shine">{hero.primaryAction}</BookingLink>
            <a className="btn btn--secondary" href="#services">
              {hero.secondaryAction}
            </a>
          </div>
          <dl className="isp-stats enter" style={order(5)}>
            {hero.stats.map((stat) => (
              <div key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>
                  <CountUp value={stat.value} />
                </dd>
              </div>
            ))}
          </dl>
          <p className="isp-hero__note enter" style={order(6)}>
            {hero.note}
          </p>
        </div>

        <div className="isp-hero__media">
          <span className="isp-hero__ring" aria-hidden="true" data-depth="10,8" />
          <Sparkles />
          <div className="isp-hero__photo" data-depth="-12,-9">
            <Crossfade slides={hero.slides} ms={5200} priority showDots sizes="(min-width: 1000px) 34vw, 80vw" />
          </div>
          <div className="isp-hero__inset" data-depth="18,14">
            <Crossfade slides={hero.insetSlides} ms={6000} sizes="200px" />
          </div>
          <a className="isp-hero__badge" href="#testimonials" data-depth="22,16">
            <b>{location.rating.value}</b>
            <span>
              <span className="isp-hero__stars" aria-hidden="true">
                ★★★★★
              </span>
              <small>{location.rating.votes} · Яндекс Карты</small>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
