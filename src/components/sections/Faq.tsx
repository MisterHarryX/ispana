import { useDeferredValue, useId, useMemo, useState, type CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { spotlight } from '../../hooks/useTilt.ts';
import { contactHref } from '../../lib/contacts.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { Icon } from '../ui/Icon.tsx';
import { Drawing } from '../art/Drawings.tsx';

const fold = (t: string) => t.toLowerCase().replace(/ё/g, 'е');

/**
 * Questions: a search over questions and answers, soft cards that open smoothly
 * (one at a time) and a card with a photo of the reception to ask the rest.
 */
export function Faq() {
  const { faq, contacts } = site;
  const uid = useId();
  const [open, setOpen] = useState<number | null>(0);
  const [query, setQuery] = useState('');
  const q = useDeferredValue(fold(query.trim()));
  const telegram = contacts.find((c) => c.kind === 'telegram');
  const phone = contacts.find((c) => c.kind === 'phone');
  const shown = useMemo(
    () => faq.items.map((item, i) => ({ item, i })).filter(({ item }) => !q || fold(`${item.question} ${item.answer}`).includes(q)),
    [faq.items, q],
  );

  return (
    <section id="faq" className="section isp-faq" aria-labelledby="faq-title">
      <div className="wrap isp-faq__grid">
        <div className="isp-faq__aside">
          <header className="section-heading">
            <p className="isp-eyebrow">Вопросы и ответы</p>
            <h2 id="faq-title" className="section-title">
              {faq.title}
            </h2>
            <p className="section-lead">{faq.lead}</p>
          </header>

          <label className="isp-faq__search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4.5 4.5" />
            </svg>
            <span className="visually-hidden">Найти ответ</span>
            <input type="search" placeholder="Найти ответ: лазер, перманент, оплата…" value={query} onChange={(e) => setQuery(e.target.value)} enterKeyHint="search" />
          </label>

          <div className="isp-ask" onPointerMove={spotlight}>
            <span className="isp-ask__art"><Drawing id="chat" /></span>
            <div className="isp-ask__body">
              <strong>Остались вопросы?</strong>
              <span>Администратор ответит и подберёт удобное время.</span>
              <div className="isp-ask__actions">
                {telegram && (
                  <a className="isp-ask__icon" href={contactHref(telegram)} target="_blank" rel="noopener noreferrer" aria-label="Написать в Telegram">
                    <Icon name="telegram" size={18} />
                  </a>
                )}
                {phone && (
                  <a className="isp-ask__icon" href={contactHref(phone)} aria-label={`Позвонить: ${phone.value}`}>
                    <Icon name="phone" size={18} />
                  </a>
                )}
                <BookingLink className="btn--compact">Записаться</BookingLink>
              </div>
            </div>
          </div>
        </div>

        <ul className="isp-faq__list">
          {shown.map(({ item, i }, n) => {
            const isOpen = open === i;
            return (
              <li key={item.question} className="isp-qa" data-open={isOpen || undefined} style={{ '--i': n } as CSSProperties} onPointerMove={spotlight}>
                <h3>
                  <button
                    type="button"
                    id={`${uid}-q${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`${uid}-a${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="isp-qa__num" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="isp-qa__q">{item.question}</span>
                    <span className="isp-qa__sign" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`${uid}-a${i}`} className="isp-qa__panel" role="region" aria-labelledby={`${uid}-q${i}`} inert={!isOpen}>
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </li>
            );
          })}
          {shown.length === 0 && (
            <li className="isp-qa isp-qa--empty">
              <p>
                Такого вопроса пока нет — спросите администратора, он ответит.{' '}
                <button type="button" className="text-button" onClick={() => setQuery('')}>
                  Показать все вопросы
                </button>
              </p>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
