import { useRef, type CSSProperties } from 'react';
import type { Testimonial } from '../../config/types.ts';
import { site } from '../../config/site.ts';
import { spotlight } from '../../hooks/useTilt.ts';
import { CountUp, useOnce } from '../ui/Motion.tsx';

/** Only genuine testimonials are shown; the section disappears until there is one. */
export function visibleTestimonials() {
  return site.testimonials.items.filter((t) => !t.sample);
}

const reviewsUrl = (path = 'reviews/') => `https://yandex.ru/maps/org/${site.location.orgId}/${path}`;

function Stars() {
  return (
    <span className="isp-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" style={{ '--s': i } as CSSProperties}>
          <path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" />
        </svg>
      ))}
    </span>
  );
}

function Card({ review }: { review: Testimonial }) {
  return (
    <figure className="isp-review" onPointerMove={spotlight}>
      <Stars />
      <blockquote>
        <p>{review.text}</p>
      </blockquote>
      <figcaption>
        <span className="isp-review__avatar" aria-hidden="true">
          {review.name[0]}
        </span>
        <span>
          <strong>{review.name}</strong>
          <small>
            {review.context}
            {review.date && ` · ${review.date}`}
          </small>
        </span>
      </figcaption>
    </figure>
  );
}

/** A row of cards that drifts sideways forever; the copy is hidden from screen readers. */
function Lane({ items, reverse = false }: { items: Testimonial[]; reverse?: boolean }) {
  return (
    <div className="isp-lane" data-reverse={reverse || undefined}>
      <div className="isp-lane__track">
        {[0, 1].map((copy) => (
          <ul key={copy} className="isp-lane__run" aria-hidden={copy === 1 || undefined}>
            {items.map((r, i) => (
              <li key={`${copy}-${i}`}>
                <Card review={r} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/**
 * Reviews: the Yandex score with stars that fill in and «what guests praise» chips,
 * then two lanes of review cards drifting in opposite directions (paused under the pointer).
 */
export function Testimonials() {
  const items = visibleTestimonials();
  const { testimonials, location } = site;
  const ref = useRef<HTMLDivElement>(null);
  const seen = useOnce(ref);
  if (items.length === 0) return null;
  const half = Math.ceil(items.length / 2);

  return (
    <section id="testimonials" className="section isp-reviews" aria-labelledby="testimonials-title">
      <div className="wrap">
        <div ref={ref} className="isp-reviews__head isp-reveal" data-seen={seen || undefined}>
          <div className="isp-reviews__intro">
            <p className="isp-eyebrow">Яндекс Карты</p>
            <h2 id="testimonials-title" className="section-title">
              {testimonials.title}
            </h2>
            <p className="section-lead">{testimonials.lead}</p>
          </div>
          <div className="isp-score">
            <b className="isp-score__value">
              <CountUp value={location.rating.value} ms={1200} />
            </b>
            <div>
              <Stars />
              <p>
                {location.rating.votes} · {location.rating.reviews}
              </p>
            </div>
          </div>
          {testimonials.aspects && (
            <ul className="isp-praise" aria-label="Что хвалят гости">
              {testimonials.aspects.map((a, i) => (
                <li key={a.label} style={{ '--i': i, '--p': `${a.percent}%` } as CSSProperties}>
                  <span>{a.label}</span>
                  <b>{a.percent}%</b>
                  <small>{a.reviews}</small>
                  <i aria-hidden="true" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="isp-reviews__lanes" role="region" aria-label="Отзывы гостей">
        <Lane items={items.slice(0, half)} />
        <Lane items={items.slice(half)} reverse />
      </div>

      <div className="wrap isp-reviews__links">
        <a className="btn btn--secondary btn--compact" href={reviewsUrl()} target="_blank" rel="noopener noreferrer">
          Все отзывы на Яндексе ↗
        </a>
        <a className="text-link" href={reviewsUrl('reviews/?add-review=true')} target="_blank" rel="noopener noreferrer">
          Оставить отзыв
        </a>
      </div>
    </section>
  );
}
