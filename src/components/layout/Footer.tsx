import { useEffect, useState } from 'react';
import { site } from '../../config/site.ts';
import { useBooking } from '../../lib/BookingContext.tsx';
import { contactDisplay, contactHref, contactNames, isExternal } from '../../lib/contacts.ts';
import { Icon } from '../ui/Icon.tsx';
import { AdminHost, AdminKey } from './AdminShortcut.tsx';
import { IspanaMark, type NavItem } from './Header.tsx';

/** Opening and closing hour from «10:00–21:00». */
const [OPEN_H, CLOSE_H] = (site.location.hours[0]?.time ?? '10:00–21:00').split(/[–-]/).map((t) => Number.parseInt(t, 10));

/** Whether the studio is open right now, in Moscow time; refreshed every minute. */
function useOpenNow() {
  const read = () => {
    const hour = Number(new Intl.DateTimeFormat('ru-RU', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Moscow' }).format(new Date()));
    return hour >= OPEN_H && hour < CLOSE_H;
  };
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    setOpen(read());
    const timer = window.setInterval(() => setOpen(read()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return open;
}

export function Footer({ nav }: { nav: NavItem[] }) {
  const year = new Date().getFullYear();
  const { requestBooking } = useBooking();
  const openNow = useOpenNow();
  const { rating } = site.location;

  const toTop = () => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <footer className="site-footer">
      <div className="wrap site-footer__grid">
        <div className="site-footer__brand">
          <a className="brand brand--footer" href="#top">
            <IspanaMark className="site-footer__mark-icon" />
            <span className="isp-wordmark">{site.meta.brand}</span>
          </a>
          <p>{site.footer.note}</p>

          <div className="footer-status">
            <span className="footer-status__dot" data-open={openNow ?? undefined} aria-hidden="true" />
            <span>
              <strong>{openNow === null ? 'Ежедневно' : openNow ? 'Сейчас открыто' : 'Сейчас закрыто'}</strong>
              <small>
                {openNow === false
                  ? `Откроемся в ${String(OPEN_H).padStart(2, '0')}:00 · без выходных`
                  : `до ${String(CLOSE_H).padStart(2, '0')}:00 · без выходных`}
              </small>
            </span>
          </div>

          <a className="footer-rating" href={`https://yandex.ru/maps/org/${site.location.orgId}/reviews/`} target="_blank" rel="noopener noreferrer">
            <b>{rating.value}</b>
            <span>
              <span className="footer-rating__stars" aria-hidden="true">
                ★★★★★
              </span>
              <small>{rating.award ?? 'Яндекс Карты'}</small>
            </span>
          </a>

          <button type="button" className="btn btn--primary site-footer__cta" onClick={() => requestBooking()}>
            Записаться онлайн
          </button>
        </div>

        <nav className="site-footer__nav" aria-label="Разделы сайта">
          <p className="site-footer__title">Разделы</p>
          <ul className="site-footer__list site-footer__list--nav">
            {nav.map((item) => (
              <li key={item.href}>
                <a className="nav-link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {site.contacts.length > 0 && (
          <div className="site-footer__contacts">
            <p className="site-footer__title">Связаться</p>
            <ul className="site-footer__list" aria-label="Контакты">
              {site.contacts.map((contact) => (
                <li key={contact.kind + contact.value}>
                  <a
                    className="site-footer__contact"
                    href={contactHref(contact)}
                    onClick={
                      contact.kind === 'booking' && contact.value.startsWith('#')
                        ? (e) => {
                            e.preventDefault();
                            requestBooking();
                          }
                        : undefined
                    }
                    {...(isExternal(contact) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="site-footer__icon">
                      <Icon name={contact.kind} size={18} />
                    </span>
                    <span>
                      {contact.label ?? contactNames[contact.kind]}
                      <span className="site-footer__handle">{contactDisplay(contact)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <a className="site-footer__address" href="#location">
              <span>{site.address.line}</span>
              <span>{site.address.note}</span>
            </a>
          </div>
        )}

      </div>

      <div className="wrap site-footer__mark" aria-hidden="true">
        <span className="site-footer__word">{site.meta.brand}</span>
        <span className="site-footer__motto">{site.footer.motto}</span>
      </div>

      <div className="wrap site-footer__bottom">
        <p>{site.footer.disclaimer}</p>
        <div className="site-footer__end">
          <p className="site-footer__copy">
            © {year} {site.meta.brand}
            <AdminKey />
          </p>
          <button type="button" className="site-footer__top" onClick={toTop} aria-label="Наверх">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        </div>
      </div>
      <AdminHost />
    </footer>
  );
}
