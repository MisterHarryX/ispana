import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { CONTACT_PREFS, CONTACT_PREF_LABELS, formatPhone, normalizePhone, type ContactPref } from '../../../shared/booking.ts';
import { DEFAULT_WORK_HOURS, bookableDays, slotsFor, type Availability } from '../../../shared/schedule.ts';
import { zonedTime } from '../../../shared/time.ts';
import { cards } from '../../config/cards.ts';
import { site } from '../../config/site.ts';
import type { Master, Service } from '../../config/types.ts';
import { getAvailability, sendRequest } from '../../lib/api.ts';
import { contactHref } from '../../lib/contacts.ts';
import { formatPrice } from '../../lib/format.ts';

const TZ_FALLBACK = 'Europe/Moscow';
const STEPS = ['Услуга', 'Мастер', 'Дата и время', 'Контакты'] as const;
const ANY_MASTER = 'any';

/** "+7 (900) 123-45-67" while typing a Russian number; other numbers keep their digits. */
function maskPhone(input: string): string {
  let d = input.replace(/\D/g, '');
  if (!d) return input.trim().startsWith('+') ? '+' : '';
  if (d.startsWith('8')) d = `7${d.slice(1)}`;
  if (d.startsWith('9')) d = `7${d}`;
  if (!d.startsWith('7')) return `+${d.slice(0, 15)}`;
  d = d.slice(1, 11);
  let out = '+7';
  if (d.length) out += ` (${d.slice(0, 3)}`;
  if (d.length >= 3) out += ')';
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

const ERRORS: Record<string, string> = {
  'invalid-name': 'Подскажите, как к вам обращаться.',
  'invalid-phone': 'Проверьте номер телефона — в нём не хватает цифр.',
  'invalid-time': 'Это время уже прошло. Выберите другое.',
  'too-many': 'Слишком много заявок подряд. Попробуйте чуть позже или позвоните нам.',
  'storage-unavailable': 'Онлайн-запись на сайте пока не подключена к базе. Позвоните нам — запишем за минуту.',
  network: 'Нет связи с сервером. Проверьте интернет или позвоните нам.',
};

/** A calendar file for the visit, so it lands in the phone's calendar with one tap. */
function calendarFile(title: string, at: number, minutes: number): string {
  const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vasha Territoriya//Booking//RU',
    'BEGIN:VEVENT',
    `UID:${at}-${Math.random().toString(36).slice(2)}@ispana`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(at)}`,
    `DTEND:${stamp(at + minutes * 60_000)}`,
    `SUMMARY:${title} — ${site.meta.brand}`,
    `LOCATION:${site.address.note ?? ''}, ${site.address.line}`.replace(/,/g, '\\,'),
    'DESCRIPTION:Время ждёт подтверждения администратора.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
}

interface OnlineBookingProps {
  open: boolean;
  initialServiceId: string | null;
  onClose: () => void;
}

/**
 * Online booking on the site: a four-step dialog — procedure, master, day and time, contacts.
 * Free times come from the working hours set in the panel minus confirmed visits; the visit
 * lands in the panel at /admin, where the administrator confirms it. A summary on the side
 * fills in as the guest goes.
 */
export function OnlineBooking({ open, initialServiceId, onClose }: OnlineBookingProps) {
  const { services, team, contacts, booking } = site;
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [serviceId, setServiceId] = useState<string | null>(initialServiceId);
  const [masterId, setMasterId] = useState<string>(ANY_MASTER);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pref, setPref] = useState<ContactPref>('call');
  const [comment, setComment] = useState('');
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [fallbackNow] = useState(() => Date.now());
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const [icsUrl, setIcsUrl] = useState('');

  const phoneContact = contacts.find((c) => c.kind === 'phone');
  const service = services.items.find((s) => s.id === serviceId) ?? null;
  const masters = useMemo(
    () => team.items.filter((m) => m.formats?.length && (!service || m.formats.includes(service.format))),
    [team.items, service],
  );
  const master = masters.find((m) => m.id === masterId) ?? null;
  const duration = service?.minutes ?? 60;

  // Open and close the native dialog with the prop; reset to the first step on each opening.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setServiceId(initialServiceId);
      setStep(initialServiceId ? 1 : 0);
      setState({ kind: 'idle' });
      dialog.showModal();
      getAvailability().then(setAvailability);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialServiceId]);

  // A master who does not do the chosen procedure is dropped.
  useEffect(() => {
    if (masterId !== ANY_MASTER && !masters.some((m) => m.id === masterId)) setMasterId(ANY_MASTER);
  }, [masters, masterId]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step]);
  useEffect(
    () => () => {
      if (icsUrl) URL.revokeObjectURL(icsUrl);
    },
    [icsUrl],
  );

  const schedule = useMemo<Availability>(
    () => availability ?? { tz: TZ_FALLBACK, hours: DEFAULT_WORK_HOURS, busy: [], now: fallbackNow },
    [availability, fallbackNow],
  );
  const tz = schedule.tz;
  const days = useMemo(() => bookableDays(schedule.hours, schedule.now, tz), [schedule, tz]);
  const daySlots = useMemo(() => new Map(days.map((d) => [d, slotsFor(d, duration, schedule)])), [days, duration, schedule]);
  const slots = date ? (daySlots.get(date) ?? []) : [];

  useEffect(() => {
    if (time && !slots.some((s) => s.time === time && s.free)) setTime('');
  }, [slots, time]);
  // The first day with a free time is offered straight away.
  useEffect(() => {
    if (step === 2 && !date) {
      const first = days.find((d) => daySlots.get(d)?.some((s) => s.free));
      if (first) setDate(first);
    }
  }, [step, date, days, daySlots]);

  const fmt = useMemo(() => {
    const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: tz });
    const longDay = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: tz });
    const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', timeZone: tz });
    const month = new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: tz });
    return {
      chip: (key: string) => {
        const at = zonedTime(key, '12:00', tz);
        return { weekday: weekday.format(at).replace('.', ''), day: day.format(at), month: month.format(at).replace('.', '') };
      },
      long: (key: string) => longDay.format(zonedTime(key, '12:00', tz)),
    };
  }, [tz]);

  const formats = useMemo(() => [...new Set(services.items.map((s) => s.format))], [services.items]);
  const shownServices = services.items.filter((s) => {
    if (format && s.format !== format) return false;
    const q = query.trim().toLowerCase().replace(/ё/g, 'е');
    return !q || `${s.title} ${s.summary} ${s.format}`.toLowerCase().replace(/ё/g, 'е').includes(q);
  });

  const canNext = [Boolean(service), true, Boolean(date && time), Boolean(name.trim() && normalizePhone(phone))][step];
  const go = (next: number) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (state.kind === 'sending') return;
    if (!name.trim()) return setState({ kind: 'error', message: ERRORS['invalid-name'] });
    if (!normalizePhone(phone)) return setState({ kind: 'error', message: ERRORS['invalid-phone'] });
    setState({ kind: 'sending' });
    const question = [
      'Онлайн-запись на сайте.',
      `Мастер: ${master ? master.name : 'любой свободный'}.`,
      comment.trim() ? `Пожелания: ${comment.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' ');
    const result = await sendRequest({
      name,
      phone,
      contactPref: pref,
      serviceId: service?.id ?? null,
      serviceTitle: service?.title ?? null,
      masterId: master?.id ?? null,
      durationMin: duration,
      question,
      date,
      time,
      website: '',
    });
    if (result.ok) {
      setState({ kind: 'sent' });
      if (service && date && time) setIcsUrl(calendarFile(service.title, zonedTime(date, time, tz), duration));
      getAvailability().then(setAvailability);
    } else {
      setState({ kind: 'error', message: ERRORS[result.error] ?? 'Не получилось отправить. Попробуйте ещё раз или позвоните нам.' });
    }
  };

  const restart = () => {
    setState({ kind: 'idle' });
    setTime('');
    setDate('');
    setComment('');
    setDir(-1);
    setStep(0);
  };

  const close = () => {
    if (state.kind === 'sent') restart();
    onClose();
  };

  const serviceRow = (s: Service, i: number) => (
    <li key={s.id} style={{ '--n': Math.min(i, 10) } as CSSProperties}>
      <button
        type="button"
        className="ob-option"
        aria-pressed={s.id === serviceId}
        onClick={() => {
          setServiceId(s.id);
          go(1);
        }}
      >
        <span className="ob-option__check" aria-hidden="true" />
        <span className="ob-option__main">
          <b>{s.title}</b>
          <small>
            {s.format} · {s.duration}
          </small>
        </span>
        <span className="ob-option__price">{formatPrice(s.price)}</span>
      </button>
    </li>
  );

  const masterCard = (m: Master | null, i: number) => {
    const id = m?.id ?? ANY_MASTER;
    return (
      <li key={id} style={{ '--n': i } as CSSProperties}>
        <button type="button" className="ob-master" aria-pressed={masterId === id} onClick={() => setMasterId(id)}>
          <span className="ob-master__photo" aria-hidden="true">
            {m?.photo ? <img src={m.photo} alt="" width={120} height={150} loading="lazy" /> : m ? <i>{m.name[0]}</i> : <i>✦</i>}
          </span>
          <span className="ob-master__name">{m ? m.name : 'Любой мастер'}</span>
          <span className="ob-master__role">{m ? m.role : 'Подберём того, у кого свободно в выбранное время'}</span>
          {m?.card && <img className="ob-master__work" src={cards[m.card].src} alt="" width={60} height={80} loading="lazy" />}
        </button>
      </li>
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="ob"
      aria-labelledby={`${uid}-title`}
      onClose={close}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === dialogRef.current && close()}
    >
      <div className="ob__frame">
        <header className="ob__head">
          <div>
            <p className="ob__eyebrow">{site.meta.brand} · онлайн-запись</p>
            <h2 id={`${uid}-title`} className="ob__title">
              {state.kind === 'sent' ? 'Запись принята' : STEPS[step]}
            </h2>
          </div>
          <button type="button" className="ob__close" onClick={close} aria-label="Закрыть онлайн-запись">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          {state.kind !== 'sent' && (
            <ol className="ob__steps" aria-label="Шаги записи">
              {STEPS.map((label, i) => (
                <li key={label} data-state={i < step ? 'done' : i === step ? 'current' : 'next'} aria-current={i === step ? 'step' : undefined}>
                  <button type="button" disabled={i > step} onClick={() => go(i)}>
                    <span className="ob__dot">{i < step ? '✓' : i + 1}</span>
                    <span className="ob__step-label">{label}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </header>

        <div className="ob__layout">
          <div className="ob__body" ref={bodyRef}>
            {state.kind === 'sent' ? (
              <div className="ob-done" role="status">
                <svg className="ob-done__mark" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                  <circle cx="60" cy="60" r="52" pathLength={1} />
                  <path d="M38 62l15 15 30-34" pathLength={1} />
                </svg>
                <p className="ob-done__lead">
                  {name.trim()}, спасибо! Ждём вас <b>{date && fmt.long(date)}</b> в <b>{time}</b>
                  {service && <> на процедуру «{service.title}»</>}.{master && <> Мастер — {master.name}.</>}
                </p>
                <p className="ob-done__note">
                  Администратор подтвердит запись {pref === 'call' ? 'звонком' : `в ${CONTACT_PREF_LABELS[pref]}`} по номеру{' '}
                  {formatPhone(normalizePhone(phone))}. Если планы изменятся — просто позвоните нам.
                </p>
                <div className="ob-done__actions">
                  {icsUrl && (
                    <a className="btn btn--primary" href={icsUrl} download="ispana.ics">
                      Добавить в календарь
                    </a>
                  )}
                  <button type="button" className="btn btn--secondary" onClick={restart}>
                    Записаться ещё
                  </button>
                </div>
                <p className="ob-done__address">
                  {site.address.line} · {site.address.note}
                </p>
              </div>
            ) : (
              <div className="ob-step" key={step} data-dir={dir}>
                {step === 0 && (
                  <>
                    <label className="ob-search">
                      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <circle cx="10.5" cy="10.5" r="6.5" />
                        <path d="m15.5 15.5 5 5" />
                      </svg>
                      <span className="visually-hidden">Найти процедуру</span>
                      <input type="search" placeholder="Найти процедуру" value={query} onChange={(e) => setQuery(e.target.value)} enterKeyHint="search" />
                    </label>
                    <div className="ob-chips" role="group" aria-label="Направление">
                      <button type="button" className="price-chip" aria-pressed={format === null} onClick={() => setFormat(null)}>
                        Все
                      </button>
                      {formats.map((f) => (
                        <button key={f} type="button" className="price-chip" aria-pressed={format === f} onClick={() => setFormat(format === f ? null : f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                    <ul className="ob-list">{shownServices.map(serviceRow)}</ul>
                    {shownServices.length === 0 && <p className="ob-empty">Ничего не нашли. Попробуйте другое слово или позвоните нам.</p>}
                  </>
                )}

                {step === 1 && (
                  <>
                    <p className="ob-hint">Выберите мастера или доверьте выбор нам.</p>
                    <ul className="ob-masters">{[null, ...masters].map(masterCard)}</ul>
                  </>
                )}

                {step === 2 && (
                  <>
                    <p className="ob-hint">
                      Время московское. Процедура длится {service?.duration ?? 'около часа'}.
                    </p>
                    <div className="ob-days" role="radiogroup" aria-label="День">
                      {days.map((key) => {
                        const d = fmt.chip(key);
                        const free = daySlots.get(key)?.some((s) => s.free) ?? false;
                        return (
                          <button key={key} type="button" role="radio" aria-checked={date === key} className="ob-day" disabled={!free} onClick={() => setDate(key)}>
                            <small>{d.weekday}</small>
                            <b>{d.day}</b>
                            <small>{d.month}</small>
                          </button>
                        );
                      })}
                    </div>
                    {date ? (
                      <>
                        <p className="ob-day-title">{fmt.long(date)}</p>
                        <div className="ob-slots" role="radiogroup" aria-label="Время" key={date}>
                          {slots.map((s, i) => (
                            <button
                              key={s.time}
                              type="button"
                              role="radio"
                              aria-checked={time === s.time}
                              className="ob-slot"
                              disabled={!s.free}
                              style={{ '--n': i } as CSSProperties}
                              onClick={() => setTime(s.time)}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="ob-empty">Свободных окон в ближайшие дни нет — позвоните, подберём время.</p>
                    )}
                  </>
                )}

                {step === 3 && (
                  <form className="ob-form" onSubmit={submit} noValidate id={`${uid}-form`}>
                    <div className="ob-row">
                      <label className="ob-field">
                        <span>Как к вам обращаться</span>
                        <input type="text" autoComplete="given-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} required />
                      </label>
                      <label className="ob-field">
                        <span>Телефон</span>
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          maxLength={22}
                          placeholder="+7 (900) 000-00-00"
                          value={phone}
                          onChange={(e) => setPhone(maskPhone(e.target.value))}
                          required
                        />
                      </label>
                    </div>
                    <fieldset className="ob-pref">
                      <legend>Как подтвердить запись</legend>
                      <div className="ob-chips">
                        {CONTACT_PREFS.map((p) => (
                          <button key={p} type="button" className="price-chip" aria-pressed={pref === p} onClick={() => setPref(p)}>
                            {CONTACT_PREF_LABELS[p]}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <label className="ob-field">
                      <span>Пожелания (необязательно)</span>
                      <textarea rows={3} maxLength={400} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Например: первый раз, нужна консультация" />
                    </label>
                    <p className="ob-consent">{booking.privacyNote}</p>
                  </form>
                )}
              </div>
            )}
          </div>

          {state.kind !== 'sent' && (
            <aside className="ob-summary" aria-label="Ваша запись">
              <p className="ob-summary__title">Ваша запись</p>
              <dl>
                <div data-filled={Boolean(service)}>
                  <dt>Процедура</dt>
                  <dd>{service ? service.title : '—'}</dd>
                </div>
                <div data-filled={step > 1 || masterId !== ANY_MASTER}>
                  <dt>Мастер</dt>
                  <dd>{master ? master.name : step > 1 ? 'Любой свободный' : '—'}</dd>
                </div>
                <div data-filled={Boolean(date && time)}>
                  <dt>Когда</dt>
                  <dd>{date && time ? `${fmt.long(date)}, ${time}` : date ? fmt.long(date) : '—'}</dd>
                </div>
              </dl>
              {service && (
                <p className="ob-summary__price">
                  <span>{service.duration}</span>
                  <b>{formatPrice(service.price)}</b>
                </p>
              )}
              <p className="ob-summary__place">
                {site.address.line}
                <br />
                ежедневно {site.location.hours[0]?.time ?? "10:00–21:00"}
              </p>
            </aside>
          )}
        </div>

        {state.kind !== 'sent' && (
          <footer className="ob__foot">
            {state.kind === 'error' ? (
              <p className="ob__error" role="alert">
                {state.message}{' '}
                {phoneContact && (
                  <a className="text-link" href={contactHref(phoneContact)}>
                    {phoneContact.value}
                  </a>
                )}
              </p>
            ) : (
              <p className="ob__foot-note">{step === 3 ? 'Администратор подтвердит время звонком или сообщением.' : `Шаг ${step + 1} из ${STEPS.length}`}</p>
            )}
            <div className="ob__nav">
              {step > 0 && (
                <button type="button" className="btn btn--secondary" onClick={() => go(step - 1)}>
                  Назад
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="btn btn--primary" disabled={!canNext} onClick={() => go(step + 1)}>
                  Далее
                </button>
              ) : (
                <button type="submit" form={`${uid}-form`} className="btn btn--primary" disabled={!canNext || state.kind === 'sending'}>
                  {state.kind === 'sending' ? 'Записываем…' : 'Записаться'}
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </dialog>
  );
}
