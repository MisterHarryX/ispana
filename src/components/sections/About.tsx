import { useRef, type CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { useInView } from '../../hooks/useInView.ts';
import { useFlipTour } from '../../hooks/useFlipTour.ts';
import { spotlight, useTilt } from '../../hooks/useTilt.ts';
import { Drawing, type DrawingId } from '../art/Drawings.tsx';
import { FlipCard } from '../ui/FlipCard.tsx';
import { CountUp } from '../ui/Motion.tsx';

/**
 * A quiet 2×2 grid of squares: three photos that turn over to a fact with a drawing, and a
 * rating tile. The grid leans a little towards the pointer and a soft light follows it;
 * the other squares fade back while one is under the pointer.
 */
function Tiles() {
  const cards = site.practitioner.cards;
  const { rating } = site.location;
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, '-20% 0px');
  const { isFlipped, set } = useFlipTour(cards.length, inView);
  const tilt = useTilt(4);

  return (
    <div className="isp-tiles-wrap">
      <div
        ref={ref}
        className="isp-tiles"
        onPointerMove={(e) => {
          tilt.onPointerMove(e);
          spotlight(e);
        }}
        onPointerLeave={tilt.onPointerLeave}
      >
        {cards.map((card, i) => (
          <FlipCard
            key={card.title}
            className={`isp-tile${card.frontDrawing ? ' isp-tile--art' : ''}`}
            style={{ '--i': i } as CSSProperties}
            label={card.title}
            flipped={isFlipped(i)}
            onFlip={(v) => set(i, v)}
            front={
              <>
                {card.frontDrawing ? (
                  <span className="isp-tile__art">
                    <Drawing id={card.frontDrawing as DrawingId} label={card.alt} />
                  </span>
                ) : (
                  <img src={card.src} alt={card.alt} loading="lazy" decoding="async" style={{ objectPosition: card.focus ?? '50% 50%' }} />
                )}
                <span className="isp-tile__label">
                  <small>{String(i + 1).padStart(2, '0')}</small>
                  {card.title}
                </span>
              </>
            }
            back={
              <div className="isp-tile__back">
                <Drawing id={card.drawing as DrawingId} active={isFlipped(i)} />
                <strong>{card.title}</strong>
                <p>{card.text}</p>
              </div>
            }
          />
        ))}
        <a className="isp-tile isp-tile--score" href="#testimonials" style={{ '--i': 3 } as CSSProperties}>
          <span className="isp-tile__score">
            <CountUp value={rating.value} ms={1200} />
          </span>
          <span className="isp-tile__stars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((s) => (
              <i key={s} style={{ '--s': s } as CSSProperties}>
                ★
              </i>
            ))}
          </span>
          <span className="isp-tile__caption">
            {rating.votes} на Яндекс Картах
            <b aria-hidden="true">→</b>
          </span>
        </a>
        <span className="isp-tiles__light" aria-hidden="true" />
      </div>
      <p className="isp-tiles__hint" aria-hidden="true">
        Наведите или нажмите на фото — оно перевернётся
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
          <Tiles />
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
