import { useState } from 'react';
import { site } from '../../config/site.ts';
import { Drawing } from '../art/Drawings.tsx';
import { spotlight } from '../../hooks/useTilt.ts';
import { contactHref } from '../../lib/contacts.ts';
import { Icon } from '../ui/Icon.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';

const org = (path = '') => `https://yandex.ru/maps/org/${site.location.orgId}/${path}`;

/**
 * «Как нас найти»: the studio's own Yandex Maps card embedded in a dark map, with hours,
 * directions and the rating from the same card. The map stays inert until it is tapped,
 * so scrolling the page never gets caught inside it.
 */
export function Location() {
  const { location, address, contacts } = site;
  const [active, setActive] = useState(false);
  const phone = contacts.find((c) => c.kind === 'phone');
  const ll = `${location.lon}%2C${location.lat}`;
  const widget = `https://yandex.ru/map-widget/v1/?ll=${ll}&z=17&oid=${location.orgId}&ol=biz`;
  const route = `https://yandex.ru/maps/?rtext=~${location.lat}%2C${location.lon}&rtt=auto`;

  return (
    <section id="location" className="section location" aria-labelledby="location-title">
      <div className="wrap location__grid">
        <div className="location__info">
          <SectionHeading id="location-title" title={location.title} lead={location.lead} />

          <dl className="location__facts">
            <div>
              <dt>
                <Icon name="pin" size={18} /> Адрес
              </dt>
              <dd>
                <strong>{address.line}</strong>
                {address.note && <span>{address.note}</span>}
              </dd>
            </div>
            <div>
              <dt>
                <Icon name="clock" size={18} /> Часы работы
              </dt>
              <dd>
                {location.hours.map((h) => (
                  <span key={h.days} className="location__hours">
                    <strong>{h.time}</strong> {h.days.toLowerCase()}
                  </span>
                ))}
              </dd>
            </div>
            {phone && (
              <div>
                <dt>
                  <Icon name="phone" size={18} /> Телефон
                </dt>
                <dd>
                  <a className="text-link" href={contactHref(phone)}>
                    {phone.value}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <ul className="location__directions">
            {location.directions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          <div className="location__actions">
            <a className="btn btn--primary" href={route} target="_blank" rel="noopener noreferrer">
              <Icon name="route" size={18} /> Построить маршрут
            </a>
            <a className="btn btn--secondary" href={org()} target="_blank" rel="noopener noreferrer">
              Открыть в Яндекс Картах ↗
            </a>
          </div>

          <ul className="location__features" aria-label="Удобства">
            {location.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="location__media">
          <div className={`location__map${active ? ' is-active' : ''}`} onPointerMove={spotlight}>
            <iframe
              src={widget}
              title={`${site.meta.brand} на Яндекс Картах`}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={active ? 0 : -1}
            />
            {!active && (
              <button type="button" className="location__unlock" onClick={() => setActive(true)}>
                <span>Нажмите, чтобы двигать карту</span>
              </button>
            )}
          </div>
          <div className="location__photo isp-location-art">
            <Drawing id="storefront" label="Рисунок: вход в салон ISPANA" />
          </div>
        </div>

        <aside className="rating" aria-label="Рейтинг на Яндекс Картах" onPointerMove={spotlight}>
          <div className="rating__score">
            <span className="rating__value">{location.rating.value}</span>
            <span className="rating__stars" aria-hidden="true">
              {Array.from({ length: 5 }, (_, i) => (
                <Icon key={i} name="star" size={18} />
              ))}
            </span>
          </div>
          <p className="rating__text">
            <strong>Рейтинг на Яндекс Картах</strong>
            <span>
              {location.rating.votes} · {location.rating.reviews}
            </span>
          </p>
          {location.rating.award && (
            <p className="rating__award">
              <span aria-hidden="true">✦</span> {location.rating.award}
            </p>
          )}
          <div className="rating__links">
            <a className="text-link" href={org('reviews/')} target="_blank" rel="noopener noreferrer">
              Читать отзывы ↗
            </a>
            <a className="text-link" href={org('reviews/?add-review=true')} target="_blank" rel="noopener noreferrer">
              Оставить отзыв ↗
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
