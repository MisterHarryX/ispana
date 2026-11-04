import { useRef, type CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { useInView } from '../../hooks/useInView.ts';
import { useFlipTour } from '../../hooks/useFlipTour.ts';
import { spotlight } from '../../hooks/useTilt.ts';
import { Drawing, type DrawingId } from '../art/Drawings.tsx';
import { FlipCard } from '../ui/FlipCard.tsx';
import { CountUp } from '../ui/Motion.tsx';

/** Three fanned photo cards; each turns over to a fact with a drawing. */
function Fan() {
  const cards = site.practitioner.cards;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-20% 0px');
  const { isFlipped, set } = useFlipTour(cards.length, inView);

  return (
    <div ref={ref} className="isp-fan">
      {cards.map((card, i) => (
        <FlipCard
          key={card.src}
          className="isp-fan__card"
          style={{ '--i': i } as CSSProperties}
          label={card.title}
          flipped={isFlipped(i)}
          onFlip={(v) => set(i, v)}
          front={
            <>
              <img src={card.src} alt={card.alt} loading="lazy" decoding="async" style={{ objectPosition: card.focus ?? '50% 50%' }} />
              <span className="isp-fan__label">{card.title}</span>
            </>
          }
          back={
            <div className="isp-fan__back">
              <Drawing id={card.drawing as DrawingId} active={isFlipped(i)} />
              <strong>{card.title}</strong>
              <p>{card.text}</p>
            </div>
          }
        />
      ))}
      <p className="isp-fan__hint" aria-hidden="true">
        Наведите или нажмите на карточку
      </p>
    </div>
  );
}

export function About() {
  const p = site.practitioner;
  return (
    <section id="about" className="section isp-about" aria-labelledby="about-title">
      <div className="wrap isp-about__grid">
        <div className="isp-about__media isp-reveal">
          <Fan />
        </div>

        <div className="isp-about__content">
          <header className="section-heading">
            <p className="isp-eyebrow">{p.eyebrow}</p>
            <h2 id="about-title" className="section-title">
              {p.aboutTitle}
            </h2>
          </header>
          <div className="isp-about__intro isp-reveal">
            {p.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <ul className="isp-about__approach isp-reveal">
            {p.approach.map((item, i) => (
              <li key={item.lead} onPointerMove={spotlight} style={{ '--i': i } as CSSProperties}>
                <span className="isp-about__num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <strong>{item.lead}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <div className="isp-about__expect isp-reveal">
            <h3>{p.expectationsTitle}</h3>
            <ul>
              {p.expectations.map((item, i) => (
                <li key={item} style={{ '--i': i } as CSSProperties}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {p.credentials.length > 0 && (
            <dl className="isp-stats isp-stats--about isp-reveal">
              {p.credentials.map((c) => (
                <div key={c.label}>
                  <dt>{c.label}</dt>
                  <dd>
                    <CountUp value={c.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
