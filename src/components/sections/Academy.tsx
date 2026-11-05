import type { CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { contactHref } from '../../lib/contacts.ts';
import { Drawing, type DrawingId } from '../art/Drawings.tsx';
import { Icon } from '../ui/Icon.tsx';

/** A badge whose words run round a circle and slowly turn. */
function Badge({ text }: { text: string }) {
  return (
    <span className="isp-academy__badge" aria-hidden="true">
      <svg viewBox="0 0 120 120">
        <defs>
          <path id="isp-academy-ring" d="M60 60m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0" />
        </defs>
        <text>
          <textPath href="#isp-academy-ring" textLength="272" lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <b>I</b>
    </span>
  );
}

/**
 * «Обучаем мастеров»: what the salon teaches, how, and a way to ask about it.
 * The directions are drawn tiles that draw themselves in one after another.
 */
export function Academy() {
  const { academy, contacts } = site;
  const telegram = contacts.find((c) => c.kind === 'telegram');
  const phone = contacts.find((c) => c.kind === 'phone');

  return (
    <section id="academy" className="section isp-academy" aria-labelledby="academy-title">
      <span className="isp-academy__orb" aria-hidden="true" />
      <div className="wrap isp-academy__grid">
        <div className="isp-academy__text isp-reveal">
          <p className="isp-eyebrow">{academy.eyebrow}</p>
          <h2 id="academy-title" className="section-title">
            {academy.title}
          </h2>
          {academy.lead && <p className="section-lead">{academy.lead}</p>}

          <ul className="isp-academy__points">
            {academy.points.map((p) => (
              <li key={p.lead}>
                <strong>{p.lead}</strong> {p.text}
              </li>
            ))}
          </ul>

          <div className="isp-academy__actions">
            {telegram && (
              <a className="btn btn--primary btn--shine" href={contactHref(telegram)} target="_blank" rel="noopener noreferrer">
                <Icon name="telegram" size={18} /> {academy.action}
              </a>
            )}
            {phone && (
              <a className="btn btn--secondary" href={contactHref(phone)}>
                <Icon name="phone" size={18} /> {phone.value}
              </a>
            )}
          </div>
          {academy.note && <p className="isp-academy__note">{academy.note}</p>}
        </div>

        <div className="isp-academy__board">
          <Badge text={academy.badge.repeat(2)} />
          <ul className="isp-academy__tiles">
            {academy.directions.map((d, i) => (
              <li key={d.id} className="isp-academy__tile isp-reveal" style={{ '--i': i } as CSSProperties}>
                <Drawing id={d.drawing as DrawingId} className="isp-academy__art" />
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
