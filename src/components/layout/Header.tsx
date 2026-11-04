import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { site } from '../../config/site.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { applyTheme, useTheme } from '../../lib/theme.ts';

/** The ISPANA mark: a Bodoni «I» in a deep-rose disc with a fine ring. */
export function IspanaMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="isp-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C06D7A" />
          <stop offset="1" stopColor="#6A2B39" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#isp-mark-g)" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#F8DEDB" strokeOpacity=".55" strokeWidth="1" />
      <path d="M28.96 48.31V16.89H23.4V15.6H40.6V16.89H34.99V48.31H40.6V49.6H23.4V48.31Z" fill="#FFF5F3" />
    </svg>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <IspanaMark className="brand-mark__svg" />
      <svg className="brand-mark__ring" viewBox="0 0 40 40" focusable="false">
        <circle cx="20" cy="20" r="19" pathLength={1} />
      </svg>
    </span>
  );
}

/**
 * The section being read: the last nav target whose top has passed a line a third of the
 * way down the screen. Null above the first one (the hero).
 */
function useActiveSection(hrefs: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const targets = hrefs.map((h) => document.querySelector<HTMLElement>(h)).filter((el): el is HTMLElement => Boolean(el));
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.33;
      let current: string | null = null;
      for (const el of targets) if (el.getBoundingClientRect().top <= line) current = `#${el.id}`;
      // At the very bottom the last section wins even if it is short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && targets.length) current = `#${targets[targets.length - 1].id}`;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [hrefs.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

/** A gold bar that slides under the active nav link. */
function NavIndicator({ listRef, active }: { listRef: RefObject<HTMLUListElement | null>; active: string | null }) {
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const link = active ? listRef.current?.querySelector<HTMLElement>(`a[href="${active}"]`) : null;
      setBox(link ? { x: link.offsetLeft, w: link.offsetWidth } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, listRef]);
  return (
    <span
      className="nav-indicator"
      aria-hidden="true"
      data-visible={box !== null}
      style={box ? { width: box.w, transform: `translateX(${box.x}px)` } : undefined}
    />
  );
}

/** Sun / moon switch between the white and the dark palette. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { mode, toggle } = useTheme();
  const dark = mode === 'dark';
  useEffect(() => {
    // Sync the browser bar with the mode the inline script picked, without storing it.
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', false);
  }, []);
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      data-mode={mode}
      onClick={toggle}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={dark ? 'Светлая тема' : 'Тёмная тема'}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g className="theme-toggle__sun">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </g>
        <path className="theme-toggle__moon" d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" />
      </svg>
    </button>
  );
}

export interface NavItem {
  href: string;
  label: string;
}

export function Header({ nav }: { nav: NavItem[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const active = useActiveSection(nav.map((item) => item.href));

  useEffect(() => {
    // Reading progress runs on a CSS scroll timeline. Script drives it where that is
    // unsupported, and under reduced motion, where the stylesheet switches animations off.
    const bar = progressRef.current;
    const manual =
      bar && (!CSS.supports('animation-timeline: scroll()') || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      if (manual) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = `translateX(${((max > 0 ? window.scrollY / max : 0) * 100 - 100).toFixed(2)}%)`;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => window.innerWidth >= 1000 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="wrap site-header__bar">
        <a className="brand" href="#top">
          <BrandMark />
          <span className="brand__name isp-wordmark">{site.meta.brand}</span>
        </a>

        <nav className="site-nav" aria-label="Основная навигация">
          <ul ref={listRef}>
            {nav.map((item) => (
              <li key={item.href}>
                <a className="nav-link" href={item.href} aria-current={active === item.href ? 'location' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
            <NavIndicator listRef={listRef} active={active} />
          </ul>
        </nav>

        <div className="site-header__actions">
          <ThemeToggle className="theme-toggle--bar" />
          <BookingLink className="btn--compact">Записаться</BookingLink>
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Закрыть' : 'Меню'}
          </button>
        </div>
      </div>

      <span className="read-progress" aria-hidden="true">
        <span ref={progressRef} className="read-progress__bar" />
      </span>

      <div id="mobile-menu" className="mobile-menu" data-open={open} inert={!open}>
        <nav className="wrap" aria-label="Меню">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} onClick={() => setOpen(false)} aria-current={active === item.href ? 'location' : undefined}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <BookingLink className="mobile-menu__cta" onNavigate={() => setOpen(false)}>
            {site.hero.primaryAction}
          </BookingLink>
          <div className="mobile-menu__theme">
            <span>Тема сайта</span>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
