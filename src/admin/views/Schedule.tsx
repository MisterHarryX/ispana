import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { formatPhone, type BookingRequest } from '../../../shared/booking.ts';
import { DEFAULT_WORK_HOURS } from '../../../shared/schedule.ts';
import { addDays, dayKey, minutesOf, timeOfMinutes, weekdayOf, zonedTime } from '../../../shared/time.ts';
import { useCardDrag, type DropInfo } from '../drag.ts';
import { plural } from '../format.ts';
import { AdminIcon } from '../icons.tsx';
import { MASTERS, masterColor, masterName, masterShort } from '../masters.ts';
import { useAdmin } from '../store.tsx';

const HOUR_PX = 72;
const SNAP = 15;
const PX_PER_MIN = HOUR_PX / 60;

/** Monday of the week containing the day key. */
const mondayOf = (key: string) => addDays(key, 1 - weekdayOf(key));

/** `undefined` — the column does not decide the master; `null` — «любой мастер». */
type MasterKey = string | null | undefined;

/** A calendar column: a day of the week, or one master on the chosen day. */
interface Col {
  key: string;
  day: string;
  master: MasterKey;
}

/** Where a session would go: a day, a start minute, for whom, and (in day view) to which master. */
interface Target {
  day: string;
  minutes: number;
  id: string | null;
  master: MasterKey;
}

type Mode = 'week' | 'day';

function readMode(): Mode {
  try {
    return localStorage.getItem('vt-cal-mode') === 'day' ? 'day' : 'week';
  } catch {
    return 'week';
  }
}

/** Data attribute for a column's master: absent in week view, "none" for «любой». */
const masterAttr = (m: MasterKey) => (m === undefined ? undefined : (m ?? 'none'));
const masterFromAttr = (v: string | undefined): MasterKey => (v === undefined ? undefined : v === 'none' ? null : v);

/**
 * Planner. Week view shows the days; day view gives each master a column, so a visit dropped
 * there is assigned to that master. Placing is exact: pick a waiting request and click the
 * hour, or drag it; the block under the pointer shows start, end, overlaps and off-hours.
 * Requests that asked for a time can be confirmed on it in one click.
 */
export function Schedule() {
  const { requests, patch, open, openNew, fmt, status, overrides, now } = useAdmin();
  const tz = status.tz;
  const hours = overrides.hours ?? DEFAULT_WORK_HOURS;
  const today = dayKey(now, tz);
  const [mode, setModeState] = useState<Mode>(readMode);
  const [week, setWeek] = useState(() => mondayOf(today));
  const [day, setDay] = useState(today);
  const [filter, setFilter] = useState<string | null | 'all'>('all');
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(week, i)), [week]);
  const [placing, setPlacing] = useState<string | null>(null);
  const [hover, setHover] = useState<Target | null>(null);
  const [menu, setMenu] = useState<{ day: string; minutes: number; master: MasterKey; x: number; y: number } | null>(null);
  const dragging = useRef<{ id: string; grab: number; session: boolean } | null>(null);

  const setMode = (next: Mode, focusDay?: string) => {
    if (next === 'day') setDay(focusDay ?? (days.includes(today) ? today : week));
    if (next === 'week' && mode === 'day') setWeek(mondayOf(day));
    setModeState(next);
    try {
      localStorage.setItem('vt-cal-mode', next);
    } catch {
      // Not remembered in private mode.
    }
  };

  const cols: Col[] = useMemo(
    () =>
      mode === 'week'
        ? days.map((d) => ({ key: d, day: d, master: undefined }))
        : [...MASTERS.map((m) => ({ key: m.id, day, master: m.id as MasterKey })), { key: 'none', day, master: null }],
    [mode, days, day],
  );
  const shownDays = useMemo(() => (mode === 'week' ? days : [day]), [mode, days, day]);

  const byId = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests]);
  const sessions = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.scheduledAt &&
          r.status !== 'cancelled' &&
          shownDays.includes(dayKey(r.scheduledAt, tz)) &&
          (mode === 'day' || filter === 'all' || (r.masterId ?? null) === filter),
      ),
    [requests, shownDays, tz, mode, filter],
  );
  const inCol = (c: Col) => sessions.filter((s) => dayKey(s.scheduledAt!, tz) === c.day && (c.master === undefined || (s.masterId ?? null) === c.master));
  const waiting = useMemo(
    () =>
      requests
        .filter((r) => !r.scheduledAt && (r.status === 'new' || r.status === 'in_progress'))
        .sort((a, b) => Number(a.seen) - Number(b.seen) || (a.preferredAt ?? Infinity) - (b.preferredAt ?? Infinity) || b.createdAt - a.createdAt),
    [requests],
  );
  const asking = waiting.filter((r) => r.preferredAt && r.preferredAt > now);

  // Visible hours: working hours with a margin, widened to fit any session outside them.
  const [fromHour, toHour] = useMemo(() => {
    let from = Math.floor(minutesOf(hours.start) / 60) - 1;
    let to = Math.ceil(minutesOf(hours.end) / 60) + 1;
    for (const s of sessions) {
      const m = minutesOf(fmt.time(s.scheduledAt!));
      from = Math.min(from, Math.floor(m / 60));
      to = Math.max(to, Math.ceil((m + s.durationMin) / 60));
    }
    return [Math.max(0, from), Math.min(24, to)];
  }, [hours, sessions, fmt]);

  const startOfGrid = fromHour * 60;
  const endOfGrid = toHour * 60;

  /** Minute under a viewport Y inside a column. `floor` picks the cell under the pointer. */
  const minuteAt = (column: Element, clientY: number, how: 'floor' | 'round' = 'floor') => {
    const offset = (clientY - column.getBoundingClientRect().top) / PX_PER_MIN;
    const snapped = (how === 'floor' ? Math.floor(offset / SNAP) : Math.round(offset / SNAP)) * SNAP;
    return Math.max(startOfGrid, Math.min(endOfGrid - SNAP, startOfGrid + snapped));
  };

  const place = (id: string, at: { day: string; minutes: number; master?: MasterKey }) => {
    const r = byId.get(id);
    setPlacing(null);
    setHover(null);
    setMenu(null);
    if (!r) return;
    const scheduledAt = zonedTime(at.day, timeOfMinutes(at.minutes), tz);
    const masterChange = at.master !== undefined && at.master !== (r.masterId ?? null) ? { masterId: at.master } : {};
    if (scheduledAt === r.scheduledAt && !('masterId' in masterChange)) return;
    void patch(id, { scheduledAt, status: r.status === 'done' ? 'done' : 'scheduled', seen: true, ...masterChange }, { animate: true });
  };

  // --- Dragging: the start follows the pointer (minus where a session was grabbed) ----------

  const onDrop = (id: string, info: DropInfo) => {
    const drag = dragging.current;
    dragging.current = null;
    setHover(null);
    const column = info.zone?.closest('[data-day]') as HTMLElement | null;
    if (!column) return;
    const y = drag?.session ? info.y - drag.grab : info.y;
    place(id, { day: column.dataset.day!, minutes: minuteAt(column, y, drag?.session ? 'round' : 'floor'), master: masterFromAttr(column.dataset.master) });
  };
  const { onPointerDown, guard } = useCardDrag(onDrop);

  const startDrag = (r: BookingRequest, session: boolean) => (event: PointerEvent<HTMLElement>) => {
    dragging.current = { id: r.id, grab: session ? event.clientY - event.currentTarget.getBoundingClientRect().top : 0, session };
    onPointerDown(r.id)(event);
  };

  // On a phone the week scrolls sideways: start at today, not on Monday.
  const calRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cal = calRef.current;
    const todayCol = cal?.querySelector<HTMLElement>('.a-cal__col[data-today="true"]');
    if (cal && todayCol && mode === 'week' && cal.scrollWidth > cal.clientWidth) cal.scrollLeft = todayCol.offsetLeft - 56;
  }, [week, mode]);

  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const onOver = (event: Event) => {
      const column = (event.target as HTMLElement).closest('[data-day]') as HTMLElement | null;
      const { id, y } = (event as CustomEvent<{ id: string; y: number }>).detail;
      const drag = dragging.current;
      if (!column) return;
      const top = drag?.session ? y - drag.grab : y;
      setHover({ day: column.dataset.day!, minutes: minuteAt(column, top, drag?.session ? 'round' : 'floor'), id, master: masterFromAttr(column.dataset.master) });
    };
    const onLeave = () => setHover(null);
    grid.addEventListener('a-dragover', onOver);
    grid.addEventListener('a-dragleave', onLeave);
    return () => {
      grid.removeEventListener('a-dragover', onOver);
      grid.removeEventListener('a-dragleave', onLeave);
    };
  });

  // --- Click placing: hover shows the block, click puts it there ----------------------------

  const onColumnMove = (c: Col) => (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current || event.pointerType === 'touch') return;
    if ((event.target as Element).closest('.a-session')) return setHover(null);
    setHover({ day: c.day, minutes: minuteAt(event.currentTarget, event.clientY), id: placing, master: c.master });
  };

  const onColumnClick = (c: Col) => (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('.a-session')) return;
    const minutes = minuteAt(event.currentTarget, event.clientY);
    if (placing) return place(placing, { day: c.day, minutes, master: c.master });
    setMenu({ day: c.day, minutes, master: c.master, x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setPlacing(null);
      setMenu(null);
      setHover(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /** Overlaps with the same master's visits (any visit when no master is known), and off-hours. */
  const checkTarget = (t: Target) => {
    const r = t.id ? byId.get(t.id) : null;
    const duration = r?.durationMin ?? hours.slotMinutes;
    const start = zonedTime(t.day, timeOfMinutes(t.minutes), tz);
    const end = start + duration * 60_000;
    const who = t.master !== undefined ? t.master : (r?.masterId ?? null);
    const clash = requests.find(
      (s) =>
        s.id !== t.id &&
        s.scheduledAt &&
        s.status !== 'done' &&
        s.status !== 'cancelled' &&
        (who === null || (s.masterId ?? null) === who || (s.masterId ?? null) === null) &&
        s.scheduledAt < end &&
        s.scheduledAt + s.durationMin * 60_000 > start,
    );
    const offHours = !hours.days.includes(weekdayOf(t.day)) || t.minutes < minutesOf(hours.start) || t.minutes + duration > minutesOf(hours.end);
    return { r, duration, clash, offHours, past: end < now };
  };

  /** Confirm a request on the time the guest asked for. */
  const confirm = (r: BookingRequest) => {
    if (!r.preferredAt) return;
    place(r.id, { day: dayKey(r.preferredAt, tz), minutes: minutesOf(fmt.time(r.preferredAt)) });
  };

  /** Today: the next full hour within working hours; another day: opening time. */
  const startFor = (date: string) => {
    if (date !== today) return hours.start;
    const m = Math.ceil((minutesOf(fmt.time(now)) + 1) / 60) * 60;
    return timeOfMinutes(Math.min(Math.max(m, minutesOf(hours.start)), minutesOf(hours.end) - 60));
  };
  const addVisit = () => {
    const date = mode === 'day' ? day : days.includes(today) ? today : week;
    openNew({ date, time: startFor(date), masterId: mode === 'week' && filter !== 'all' ? filter : null });
  };

  const label =
    mode === 'week'
      ? `${fmt.day(zonedTime(days[0], '12:00', tz))} – ${fmt.day(zonedTime(days[6], '12:00', tz))}`
      : `${fmt.weekday(zonedTime(day, '12:00', tz))}, ${fmt.day(zonedTime(day, '12:00', tz))}`;
  const todaySessions = requests
    .filter((r) => r.scheduledAt && r.status === 'scheduled' && dayKey(r.scheduledAt, tz) === today)
    .sort((a, b) => a.scheduledAt! - b.scheduledAt!);
  const next = todaySessions.find((r) => r.scheduledAt! + r.durationMin * 60_000 > now);
  const nowMinutes = minutesOf(fmt.time(now));
  const placingRequest = placing ? byId.get(placing) : null;
  const step = mode === 'week' ? 7 : 1;
  const atNow = mode === 'week' ? week === mondayOf(today) : day === today;
  const shift = (n: number) => (mode === 'week' ? setWeek(addDays(week, n)) : setDay(addDays(day, n)));

  return (
    <div className="a-schedule" data-placing={Boolean(placing)} data-mode={mode}>
      <div className="a-toolbar">
        <div className="a-weeknav">
          <div className="a-segment" role="group" aria-label="Вид календаря">
            <button type="button" aria-pressed={mode === 'week'} onClick={() => setMode('week')}>
              Неделя
            </button>
            <button type="button" aria-pressed={mode === 'day'} onClick={() => setMode('day')}>
              День
            </button>
          </div>
          <button type="button" className="a-icon-btn" onClick={() => shift(-step)} aria-label={mode === 'week' ? 'Предыдущая неделя' : 'Предыдущий день'}>
            <AdminIcon name="left" />
          </button>
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => (mode === 'week' ? setWeek(mondayOf(today)) : setDay(today))} disabled={atNow}>
            Сегодня
          </button>
          <button type="button" className="a-icon-btn" onClick={() => shift(step)} aria-label={mode === 'week' ? 'Следующая неделя' : 'Следующий день'}>
            <AdminIcon name="right" />
          </button>
          <h2 className="a-weeknav__label" key={mode + week + day}>
            {label}
          </h2>
        </div>
        <div className="a-toolbar__end">
          <p className="a-toolbar__note">
            {todaySessions.length
              ? `Сегодня ${todaySessions.length} ${plural(todaySessions.length, 'визит', 'визита', 'визитов')}${next ? ` · ближайший в ${fmt.time(next.scheduledAt!)} — ${next.name}` : ' · все прошли'}`
              : 'Сегодня визитов нет'}
          </p>
          <button type="button" className="a-btn a-btn--primary a-btn--sm" onClick={addVisit}>
            <AdminIcon name="plus" size={15} /> Запись
          </button>
        </div>
      </div>

      {mode === 'week' && MASTERS.length > 0 && (
        <div className="a-masters a-masters--filter" role="group" aria-label="Показать мастера">
          <button type="button" className="a-master-chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
            Все мастера
          </button>
          {[...MASTERS.map((m) => m.id), null].map((id) => (
            <button
              key={id ?? 'none'}
              type="button"
              className="a-master-chip"
              aria-pressed={filter === id}
              style={{ '--m': masterColor(id) } as CSSProperties}
              onClick={() => setFilter(filter === id ? 'all' : id)}
            >
              <span className="a-master-chip__dot" aria-hidden="true" />
              {id ? masterShort(id) : 'Без мастера'}
            </button>
          ))}
        </div>
      )}

      {placingRequest && (
        <div className="a-placing" role="status">
          <span className="a-placing__dot" aria-hidden="true" />
          <span>
            Куда поставить <strong>{placingRequest.name}</strong> · {placingRequest.durationMin} мин? Нажмите на час в календаре.
            {placingRequest.preferredAt && <> Гость просил {fmt.when(placingRequest.preferredAt, now)}.</>}
          </span>
          {placingRequest.preferredAt && (
            <button type="button" className="a-btn a-btn--primary a-btn--sm" onClick={() => confirm(placingRequest)}>
              На это время
            </button>
          )}
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setPlacing(null)}>
            Отмена
          </button>
        </div>
      )}

      <div className="a-schedule__layout">
        <aside className="a-waiting">
          <h3 className="a-block__title">
            Ждут подтверждения <span>{waiting.length}</span>
          </h3>
          <p className="a-waiting__hint">
            {asking.length
              ? `${asking.length} ${plural(asking.length, 'гость выбрал', 'гостя выбрали', 'гостей выбрали')} время сами — подтвердите одной кнопкой.`
              : 'Нажмите на заявку, потом на час в календаре. Или перетащите.'}
          </p>
          <div className="a-waiting__list">
            {waiting.map((r) => {
              const pref =
                r.preferredAt && r.preferredAt > now
                  ? checkTarget({ day: dayKey(r.preferredAt, tz), minutes: minutesOf(fmt.time(r.preferredAt)), id: r.id, master: undefined })
                  : null;
              return (
                <article
                  key={r.id}
                  className="a-wait"
                  data-status={r.status}
                  data-active={placing === r.id}
                  data-unseen={!r.seen}
                  onPointerDown={startDrag(r, false)}
                  style={{ viewTransitionName: `req-${r.id}`, '--m': masterColor(r.masterId) } as CSSProperties}
                >
                  <button
                    type="button"
                    className="a-card__open"
                    data-drag-through
                    onClick={guard(() => setPlacing((p) => (p === r.id ? null : r.id)))}
                    aria-pressed={placing === r.id}
                    aria-label={`Выбрать время для: ${r.name}`}
                  />
                  <span className="a-wait__name">
                    {r.name}
                    {!r.seen && <em className="a-wait__new">новая</em>}
                  </span>
                  <span className="a-wait__meta">
                    {r.serviceTitle ?? 'Процедура не выбрана'} · {r.durationMin} мин
                  </span>
                  <span className="a-wait__master">
                    <span className="a-master-chip__dot" aria-hidden="true" /> {masterName(r.masterId)}
                  </span>
                  {r.preferredAt && (
                    <span className="a-wait__prefer">
                      <AdminIcon name="clock" size={13} /> просит {fmt.when(r.preferredAt, now)}
                    </span>
                  )}
                  <span className="a-wait__phone">{formatPhone(r.phone)}</span>
                  {pref && (
                    <span className="a-wait__actions">
                      {pref.clash && <small className="a-wait__clash">занято: {pref.clash.name}</small>}
                      <button type="button" className="a-btn a-btn--primary a-btn--sm a-wait__confirm" onClick={() => confirm(r)} onPointerDown={(e) => e.stopPropagation()}>
                        <AdminIcon name="check" size={14} /> {pref.clash ? 'Всё равно подтвердить' : 'Подтвердить'}
                      </button>
                      <a className="a-icon-btn a-wait__call" href={`tel:${r.phone}`} aria-label={`Позвонить: ${r.name}`} onPointerDown={(e) => e.stopPropagation()}>
                        <AdminIcon name="phone" size={15} />
                      </a>
                    </span>
                  )}
                  <button type="button" className="a-wait__more" onClick={() => open(r.id)} aria-label={`Открыть заявку: ${r.name}`}>
                    <AdminIcon name="external" size={14} />
                  </button>
                </article>
              );
            })}
            {waiting.length === 0 && <p className="a-column__empty">Все заявки уже со временем.</p>}
          </div>
        </aside>

        <div
          ref={calRef}
          className="a-cal"
          style={{ '--hour': `${HOUR_PX}px`, '--hours': toHour - fromHour, '--cols': cols.length } as CSSProperties}
          onPointerLeave={() => !dragging.current && setHover(null)}
        >
          <div className="a-cal__head">
            <span />
            {cols.map((c) => {
              const count = inCol(c).length;
              if (mode === 'day') {
                return (
                  <div key={c.key} className="a-cal__day a-cal__day--master" style={{ '--m': masterColor(c.master) } as CSSProperties}>
                    <b>
                      <span className="a-master-chip__dot" aria-hidden="true" /> {c.master ? masterShort(c.master) : 'Любой'}
                    </b>
                    <small>{count ? `${count} ${plural(count, 'визит', 'визита', 'визитов')}` : 'свободно'}</small>
                  </div>
                );
              }
              const at = zonedTime(c.day, '12:00', tz);
              const off = !hours.days.includes(weekdayOf(c.day));
              return (
                <button
                  key={c.key}
                  type="button"
                  className="a-cal__day"
                  data-today={c.day === today}
                  data-off={off}
                  onClick={() => setMode('day', c.day)}
                  title="Открыть день по мастерам"
                >
                  <small>{fmt.weekday(at)}</small>
                  <b>{fmt.day(at).split(' ')[0]}</b>
                  {count > 0 && <small className="a-cal__count">{count}</small>}
                </button>
              );
            })}
          </div>
          <div className="a-cal__body" ref={gridRef}>
            <div className="a-cal__gutter">
              {Array.from({ length: toHour - fromHour }, (_, i) => (
                <span key={i}>{String(fromHour + i).padStart(2, '0')}:00</span>
              ))}
            </div>
            {cols.map((c) => {
              const off = !hours.days.includes(weekdayOf(c.day));
              const workTop = (minutesOf(hours.start) - startOfGrid) * PX_PER_MIN;
              const workHeight = (minutesOf(hours.end) - minutesOf(hours.start)) * PX_PER_MIN;
              const preview = hover && hover.day === c.day && hover.master === c.master ? checkTarget(hover) : null;
              return (
                <div
                  key={c.key}
                  className="a-cal__col"
                  data-drop={`col:${c.key}`}
                  data-day={c.day}
                  data-master={masterAttr(c.master)}
                  data-ghost="hide"
                  data-today={c.day === today}
                  data-off={off}
                  style={{ '--m': masterColor(c.master) } as CSSProperties}
                  onPointerMove={onColumnMove(c)}
                  onClick={onColumnClick(c)}
                >
                  {!off && <span className="a-cal__work" style={{ top: workTop, height: workHeight }} aria-hidden="true" />}
                  {c.day === today && nowMinutes >= startOfGrid && nowMinutes <= endOfGrid && (
                    <span className="a-cal__now" style={{ top: (nowMinutes - startOfGrid) * PX_PER_MIN }} aria-hidden="true" />
                  )}
                  {inCol(c).map((s) => (
                    <Session
                      key={s.id}
                      request={s}
                      showMaster={mode === 'week'}
                      top={(minutesOf(fmt.time(s.scheduledAt!)) - startOfGrid) * PX_PER_MIN}
                      moving={hover?.id === s.id}
                      onPointerDown={startDrag(s, true)}
                      onOpen={guard(() => open(s.id))}
                    />
                  ))}
                  {preview && hover && (
                    <span
                      className="a-cal__preview"
                      data-kind={hover.id ? 'place' : 'slot'}
                      data-clash={Boolean(preview.clash)}
                      data-off={preview.offHours || preview.past}
                      style={{ top: (hover.minutes - startOfGrid) * PX_PER_MIN, height: Math.max(preview.duration * PX_PER_MIN - 2, 18) }}
                      aria-hidden="true"
                    >
                      <b>
                        {timeOfMinutes(hover.minutes)}–{timeOfMinutes(hover.minutes + preview.duration)}
                      </b>
                      {preview.r ? <span>{preview.r.name}</span> : <span>+ сюда</span>}
                      {preview.clash && <em>пересекается с {preview.clash.name}</em>}
                      {!preview.clash && preview.past && <em>это время уже прошло</em>}
                      {!preview.clash && !preview.past && preview.offHours && <em>вне рабочих часов</em>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {menu && (
        <SlotMenu
          menu={menu}
          waiting={waiting}
          label={`${fmt.weekday(zonedTime(menu.day, '12:00', tz))}, ${fmt.day(zonedTime(menu.day, '12:00', tz))} · ${timeOfMinutes(menu.minutes)}${menu.master ? ` · ${masterShort(menu.master)}` : ''}`}
          onPick={(id) => place(id, { day: menu.day, minutes: menu.minutes, master: menu.master })}
          onNew={() => {
            openNew({ date: menu.day, time: timeOfMinutes(menu.minutes), masterId: menu.master ?? null });
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

function Session({
  request: r,
  top,
  moving,
  showMaster,
  onPointerDown,
  onOpen,
}: {
  request: BookingRequest;
  showMaster: boolean;
  top: number;
  moving: boolean;
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onOpen: () => void;
}) {
  const { fmt } = useAdmin();
  const height = Math.max(r.durationMin * PX_PER_MIN - 3, 26);
  return (
    <article
      className="a-session"
      data-status={r.status}
      data-short={height < 56}
      data-moving={moving}
      data-source={r.source}
      style={{ top, height, viewTransitionName: `req-${r.id}`, '--m': masterColor(r.masterId) } as CSSProperties}
      onPointerDown={onPointerDown}
    >
      <button type="button" className="a-card__open" data-drag-through onClick={onOpen} aria-label={`Открыть: ${r.name}, ${fmt.time(r.scheduledAt!)}`} />
      <span className="a-session__time">
        {fmt.time(r.scheduledAt!)}–{fmt.time(r.scheduledAt! + r.durationMin * 60_000)}
      </span>
      <span className="a-session__name">
        {r.name}
        {showMaster && r.masterId && <em className="a-session__master">{masterShort(r.masterId)}</em>}
      </span>
      {r.serviceTitle && <span className="a-session__service">{r.serviceTitle}</span>}
    </article>
  );
}

/** Menu at a clicked empty slot: put a waiting request here, or add a new one. */
function SlotMenu({
  menu,
  waiting,
  label,
  onPick,
  onNew,
  onClose,
}: {
  menu: { x: number; y: number };
  waiting: BookingRequest[];
  label: string;
  onPick: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: menu.x + 8, top: menu.y + 8 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    setPos({ left: Math.min(menu.x + 8, window.innerWidth - width - 12), top: Math.min(menu.y + 8, window.innerHeight - height - 12) });
    el.querySelector('button')?.focus();
    const onDown = (event: globalThis.PointerEvent) => !el.contains(event.target as Node) && onClose();
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, [menu, onClose]);

  return (
    <div ref={ref} className="a-slotmenu" role="menu" aria-label={`Слот ${label}`} style={pos}>
      <p className="a-slotmenu__title">{label}</p>
      {waiting.length > 0 && <p className="a-slotmenu__sub">Поставить сюда</p>}
      {waiting.slice(0, 6).map((r) => (
        <button key={r.id} type="button" role="menuitem" className="a-slotmenu__item" onClick={() => onPick(r.id)}>
          <span>{r.name}</span>
          <small>
            {r.serviceTitle ?? 'без формата'} · {r.durationMin} мин
          </small>
        </button>
      ))}
      <button type="button" role="menuitem" className="a-slotmenu__item a-slotmenu__item--new" onClick={onNew}>
        <AdminIcon name="plus" size={15} /> Новая запись на это время
      </button>
    </div>
  );
}
