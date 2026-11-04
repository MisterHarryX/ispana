import { useEffect, useId, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { CONTACT_PREFS, CONTACT_PREF_LABELS, formatPhone, normalizePhone, type ContactPref } from '../../../shared/booking.ts';
import { DEFAULT_WORK_HOURS, bookableDays, slotsFor, type Availability } from '../../../shared/schedule.ts';
import { zonedTime } from '../../../shared/time.ts';
import type { ContactMethod } from '../../config/types.ts';
import { site } from '../../config/site.ts';
import { getAvailability, sendRequest } from '../../lib/api.ts';
import { BOOKING_ID, useBooking } from '../../lib/BookingContext.tsx';
import { contactDisplay, contactHref, contactNames, isExternal, supportsPrefill } from '../../lib/contacts.ts';
import { Icon } from '../ui/Icon.tsx';
import { ServicePicker } from '../ui/ServicePicker.tsx';
import { SectionHeading } from '../ui/SectionHeading.tsx';

type CopyState = 'idle' | 'copied' | 'failed';
type SendState = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent'; when: string } | { kind: 'error'; message: string };

const TZ_FALLBACK = 'Europe/Moscow';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function channelHint(contact: ContactMethod): string {
  if (contact.kind === 'booking') return 'Все мастера и полный прайс';
  if (contact.kind === 'phone') return 'Администратор ответит и запишет';
  if (supportsPrefill[contact.kind]) return 'Текст подставится автоматически';
  return 'Текст скопируется — вставьте его в чат';
}

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
  'storage-unavailable': 'Приём заявок на сайте пока не настроен. Запишитесь онлайн или позвоните — ссылки ниже.',
  network: 'Нет связи с сервером. Проверьте интернет или позвоните нам.',
};

/**
 * Booking: a request saved on the site (name, phone, format, a free slot), and below it
 * online booking and the phone for those who prefer to book themselves.
 */
export function Booking() {
  const { booking, services, contacts } = site;
  const { serviceId, setServiceId, requestBooking } = useBooking();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPref, setContactPref] = useState<ContactPref>('call');
  const [question, setQuestion] = useState('');
  const [wishes, setWishes] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [trap, setTrap] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [fallbackNow] = useState(() => Date.now());
  const [send, setSend] = useState<SendState>({ kind: 'idle' });
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const uid = useId();

  const service = services.items.find((s) => s.id === serviceId);
  const needsTime = !service || service.minutes !== undefined;
  const durationMin = service?.minutes ?? 60;

  useEffect(() => {
    let cancelled = false;
    getAvailability().then((a) => !cancelled && setAvailability(a));
    return () => {
      cancelled = true;
    };
  }, []);

  // Without the API (a static preview) the picker still works from the default hours.
  const schedule = useMemo<Availability>(
    () => availability ?? { tz: TZ_FALLBACK, hours: DEFAULT_WORK_HOURS, busy: [], now: fallbackNow },
    [availability, fallbackNow],
  );
  const tz = schedule.tz;
  const days = useMemo(() => bookableDays(schedule.hours, schedule.now, tz), [schedule, tz]);
  const daySlots = useMemo(() => new Map(days.map((d) => [d, slotsFor(d, durationMin, schedule)])), [days, durationMin, schedule]);
  const slots = useMemo(() => (date ? (daySlots.get(date) ?? []) : []), [date, daySlots]);

  // A picked time the new format no longer fits is dropped rather than silently kept.
  useEffect(() => {
    if (time && !slots.some((s) => s.time === time && s.free)) setTime('');
  }, [slots, time]);

  const dayLabel = useMemo(() => {
    const weekday = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', timeZone: tz });
    const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', timeZone: tz });
    const month = new Intl.DateTimeFormat('ru-RU', { month: 'short', timeZone: tz });
    return (key: string) => {
      const at = zonedTime(key, '12:00', tz);
      return { weekday: weekday.format(at).replace('.', ''), day: day.format(at), month: month.format(at).replace('.', '') };
    };
  }, [tz]);

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const chosen = slots.find((s) => s.time === time);
  const localHint = useMemo(() => {
    if (!chosen || localTz === tz) return '';
    const local = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(chosen.at);
    return local === chosen.time ? '' : `По вашему времени это ${local}`;
  }, [chosen, localTz, tz]);

  const whenText = useMemo(() => {
    if (!date || !time) return '';
    const d = dayLabel(date);
    return `${d.weekday}, ${d.day} ${d.month}, в ${time}`;
  }, [date, time, dayLabel]);

  const message = useMemo(
    () =>
      [
        booking.greeting,
        service ? `Процедура: ${service.title} (${service.duration}).` : '',
        whenText ? `Удобно: ${whenText} (по Москве).` : '',
        name.trim() ? `Меня зовут ${name.trim()}.` : '',
        question.trim() ? `Пожелания: ${question.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    [booking.greeting, service, whenText, name, question],
  );
  const subject = `Запись в «${site.meta.brand}»${service ? ` — ${service.title}` : ''}`;

  useEffect(() => setCopyState('idle'), [message]);

  const onChannel = async (contact: ContactMethod) => {
    if (contact.kind !== 'telegram') return;
    // Telegram links cannot carry text to a personal chat, so the message goes to the clipboard.
    setCopyState((await copyText(message)) ? 'copied' : 'failed');
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (send.kind === 'sending') return;
    if (!name.trim()) return setSend({ kind: 'error', message: ERRORS['invalid-name'] });
    if (!normalizePhone(phone)) return setSend({ kind: 'error', message: ERRORS['invalid-phone'] });
    setSend({ kind: 'sending' });
    const result = await sendRequest({
      name,
      phone,
      contactPref,
      serviceId: service?.id ?? null,
      serviceTitle: service?.title ?? null,
      durationMin,
      question,
      date: needsTime ? date : '',
      time: needsTime ? time : '',
      website: trap,
    });
    if (result.ok) {
      setSend({ kind: 'sent', when: needsTime ? whenText : '' });
      getAvailability().then(setAvailability);
    } else {
      setSend({ kind: 'error', message: ERRORS[result.error] ?? 'Не получилось отправить заявку. Попробуйте ещё раз или позвоните нам.' });
    }
  };

  const reset = () => {
    setSend({ kind: 'idle' });
    setQuestion('');
    setTime('');
  };

  return (
    <section id={BOOKING_ID} className="section booking" aria-labelledby={`${BOOKING_ID}-title`}>
      <div className="wrap booking__grid">
        <div className="booking__intro">
          <SectionHeading id={`${BOOKING_ID}-title`} title={booking.title} lead={booking.lead} focusable />
          <p className="booking__privacy">{booking.privacyNote}</p>
          <p className="booking__address">
            <span className="booking__address-line">{site.address.line}</span>
            {site.address.note && <span className="booking__address-note">{site.address.note}</span>}
            <a className="text-link" href="#location">
              Карта и маршрут ↓
            </a>
          </p>
          {contacts.length > 0 && (
            <div className="composer__direct booking__direct">
              <p className="composer__or">
                <span>Записаться самостоятельно</span>
              </p>
              <ul className="channels" aria-label="Как записаться">
                {contacts.map((contact) => (
                  <li key={contact.kind + contact.value}>
                    {contact.kind === 'booking' && contact.value.startsWith('#') ? (
                      <button type="button" className="channel channel--booking channel--online" onClick={() => requestBooking(serviceId ?? undefined)}>
                        <Icon name="booking" size={22} />
                        <span className="channel__text">
                          <span className="channel__name">Онлайн-запись</span>
                          <span className="channel__hint">Мастер, дата и время — прямо здесь</span>
                        </span>
                        <span className="channel__handle">на сайте · 1 минута</span>
                      </button>
                    ) : (
                    <a
                      className={`channel channel--${contact.kind}`}
                      href={contactHref(contact, message, subject)}
                      onClick={() => onChannel(contact)}
                      {...(isExternal(contact) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      <Icon name={contact.kind} size={22} />
                      <span className="channel__text">
                        <span className="channel__name">{contact.label ?? contactNames[contact.kind]}</span>
                        <span className="channel__hint">{channelHint(contact)}</span>
                      </span>
                      <span className="channel__handle">{contactDisplay(contact)}</span>
                    </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="composer__status" role="status">
                {copyState === 'copied' && 'Текст скопирован. Вставьте его в чат и отправьте, когда будете готовы.'}
                {copyState === 'failed' && 'Не получилось скопировать автоматически — выделите текст и скопируйте вручную.'}
              </p>
            </div>
          )}
        </div>

        <div className="composer" data-state={send.kind}>
          {send.kind === 'sent' ? (
            <div className="sealed" role="status">
              <svg className="sealed__letter" viewBox="0 0 220 150" aria-hidden="true" focusable="false">
                <path className="sealed__paper" pathLength={1} d="M14 26h192v108H14Z" />
                <path className="sealed__fold" pathLength={1} d="M14 26l96 62 96-62" />
                <g className="sealed__wax">
                  <circle cx="110" cy="86" r="21" />
                  <path d="M116 74c-10 4-12 18-2 24-13 1-19-17-8-24 3-2 7-2 10 0Z" />
                </g>
              </svg>
              <h3 className="sealed__title">Заявка запечатана и уже у администратора</h3>
              <p className="sealed__text">
                {name.trim() ? `${name.trim()}, мы` : 'Мы'} свяжемся с вами по номеру <strong>{formatPhone(normalizePhone(phone))}</strong>
                {contactPref !== 'call' ? ` в ${CONTACT_PREF_LABELS[contactPref]}` : ''}
                {send.when ? `, чтобы подтвердить запись: ${send.when}.` : ' и подберём удобное время.'}
              </p>
              <button type="button" className="text-button" onClick={reset}>
                Оставить ещё одну заявку
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} aria-labelledby={`${uid}-legend`} noValidate>
              <h3 id={`${uid}-legend`} className="composer__title">
                Оставьте заявку
              </h3>
              <p className="composer__hint">Перезвоним, подберём мастера и подтвердим время.</p>

              <ServicePicker
                label="Процедура"
                services={services.items}
                value={serviceId}
                onChange={setServiceId}
                emptyLabel="Пока не знаю — подскажите"
              />

              {needsTime && (
                <fieldset className="when">
                  <legend>
                    Когда удобно <span className="when__tz">время московское</span>
                  </legend>
                  <div className="days" role="radiogroup" aria-label="День">
                    {days.map((key) => {
                      const d = dayLabel(key);
                      const free = daySlots.get(key)?.some((s) => s.free) ?? false;
                      return (
                        <label key={key} className="day" data-free={free}>
                          <input type="radio" name={`${uid}-day`} value={key} checked={date === key} disabled={!free} onChange={() => setDate(key)} />
                          <span>
                            <small>{d.weekday}</small>
                            <b>{d.day}</b>
                            <small>{d.month}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {date ? (
                    <div className="slots" role="radiogroup" aria-label="Время" key={`${date}-${durationMin}`}>
                      {slots.map((s, i) => (
                        <label key={s.time} className="slot" style={{ '--i': i } as CSSProperties}>
                          <input type="radio" name={`${uid}-time`} value={s.time} checked={time === s.time} disabled={!s.free} onChange={() => setTime(s.time)} />
                          <span>{s.time}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="when__empty">Выберите день — покажем свободное время. Можно и не выбирать: подберём сами.</p>
                  )}
                  {localHint && <p className="when__local">{localHint}</p>}
                </fieldset>
              )}

              <div className="composer__row">
                <div className="field">
                  <label htmlFor={`${uid}-name`}>Как к вам обращаться</label>
                  <input id={`${uid}-name`} type="text" autoComplete="given-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="field">
                  <label htmlFor={`${uid}-phone`}>Телефон</label>
                  <input
                    id={`${uid}-phone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={22}
                    placeholder="+7 (900) 000-00-00"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    required
                  />
                </div>
              </div>

              <fieldset className="composer__formats">
                <legend>Как с вами связаться</legend>
                <div className="chips">
                  {CONTACT_PREFS.map((pref) => (
                    <label key={pref} className="chip">
                      <input type="radio" name={`${uid}-pref`} value={pref} checked={contactPref === pref} onChange={() => setContactPref(pref)} />
                      <span>{CONTACT_PREF_LABELS[pref]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {wishes ? (
              <div className="field field--wishes">
                <label htmlFor={`${uid}-question`}>Пожелания: мастер, несколько процедур, вопросы</label>
                <textarea
                  id={`${uid}-question`}
                  rows={3}
                  maxLength={600}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Например: брови и ресницы в один день"
                />
              </div>
              ) : (
                <button type="button" className="text-button composer__more" onClick={() => setWishes(true)}>
                  + Пожелания: мастер, несколько процедур, вопросы
                </button>
              )}

              {/* Honeypot: hidden from people, irresistible to bots. */}
              <div className="composer__trap" aria-hidden="true">
                <label>
                  Сайт
                  <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} />
                </label>
              </div>

              <div className="composer__submit">
                <button type="submit" className="btn btn--primary" disabled={send.kind === 'sending'} data-sending={send.kind === 'sending'}>
                  {send.kind === 'sending' ? 'Отправляю…' : 'Отправить заявку'}
                </button>
                <p className="composer__consent">Нажимая кнопку, вы соглашаетесь, что мы свяжемся с вами по этому номеру.</p>
              </div>
              <p className="composer__error" role="alert">
                {send.kind === 'error' ? send.message : ''}
              </p>
            </form>
          )}

        </div>
      </div>
    </section>
  );
}
