import type { CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { useTilt } from '../../hooks/useTilt.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import type { Promo } from '../../config/types.ts';

function PromoCard({ promo, i }: { promo: Promo; i: number }) {
  const tilt = useTilt(6);
  return (
    <li className="isp-promo isp-reveal" style={{ '--i': i } as CSSProperties} {...tilt}>
      <span className="isp-promo__border" aria-hidden="true" />
      <span className="isp-promo__shine" aria-hidden="true" />
      <div className="isp-promo__body">
        {promo.tag && <span className="isp-promo__tag">{promo.tag}</span>}
        <p className="isp-promo__value">{promo.value}</p>
        {promo.note && <p className="isp-promo__note">{promo.note}</p>}
        <h3 className="isp-promo__title">{promo.title}</h3>
        <p className="isp-promo__text">{promo.text}</p>
        <BookingLink className="btn--compact isp-promo__cta" serviceId={promo.serviceId}>
          Записаться
        </BookingLink>
      </div>
    </li>
  );
}

/** Current offers: arched cards that lean towards the pointer, with a light sweep and a turning glow border. */
export function Promos() {
  const { promos } = site;
  if (!promos.items.length) return null;
  return (
    <section id="promos" className="section isp-promos isp-ink" aria-labelledby="promos-title">
      <span className="isp-promos__orb" aria-hidden="true" />
      <div className="wrap">
        <SectionHeading id="promos-title" title={promos.title} lead={promos.lead} className="isp-heading--center" />
        <ul className="isp-promos__grid">
          {promos.items.map((promo, i) => (
            <PromoCard key={promo.title} promo={promo} i={i} />
          ))}
        </ul>
        {promos.note && <p className="isp-promos__foot isp-reveal">{promos.note}</p>}
      </div>
    </section>
  );
}
