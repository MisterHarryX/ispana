import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Service } from '../../config/types.ts';
import { formatPrice } from '../../lib/format.ts';

interface ServicePickerProps {
  label: string;
  services: Service[];
  value: string | null;
  onChange: (id: string | null) => void;
  /** Text of the "no particular service" choice at the top. */
  emptyLabel: string;
}

/**
 * A themed listbox for choosing a procedure: grouped by direction, each row with its
 * price and duration. Works with the keyboard (arrows, Home/End, Enter, Escape, typing
 * the first letters) and closes on an outside click.
 */
export function ServicePicker({ label, services, value, onChange, emptyLabel }: ServicePickerProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const typed = useRef({ text: '', at: 0 });

  // Flat order used for keyboard movement: the empty choice first, then services by group.
  const groups = useMemo(() => {
    const formats = [...new Set(services.map((s) => s.format))];
    return formats.map((format) => ({ format, items: services.filter((s) => s.format === format) }));
  }, [services]);
  const flat = useMemo<(Service | null)[]>(() => [null, ...groups.flatMap((g) => g.items)], [groups]);
  const selected = services.find((s) => s.id === value) ?? null;
  const optionId = (i: number) => `${uid}-opt-${i}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, flat.findIndex((s) => (s?.id ?? null) === value)));
    setOpen(true);
    requestAnimationFrame(() => listRef.current?.focus());
  };

  const choose = (i: number) => {
    onChange(flat[i]?.id ?? null);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKey = (event: KeyboardEvent) => {
    const last = flat.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => Math.min(last, active + 1),
      ArrowUp: () => Math.max(0, active - 1),
      Home: () => 0,
      End: () => last,
      PageDown: () => Math.min(last, active + 5),
      PageUp: () => Math.max(0, active - 5),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setActive(moves[event.key]());
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(active);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key.length === 1) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + event.key.toLowerCase(), at: now };
      const hit = flat.findIndex((s, i) => i > 0 && s!.title.toLowerCase().startsWith(typed.current.text));
      if (hit > 0) setActive(hit);
    }
  };

  const onButtonKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      show();
    }
  };

  let index = 0;
  const row = (service: Service | null) => {
    const i = index++;
    const isSelected = (service?.id ?? null) === value;
    return (
      <li
        key={service?.id ?? 'none'}
        id={optionId(i)}
        role="option"
        aria-selected={isSelected}
        data-active={i === active || undefined}
        className={`picker__option${service ? '' : ' picker__option--none'}`}
        onPointerEnter={() => setActive(i)}
        onClick={() => choose(i)}
      >
        <span className="picker__check" aria-hidden="true" />
        <span className="picker__name">{service ? service.title : emptyLabel}</span>
        {service && (
          <span className="picker__meta">
            <b>{formatPrice(service.price)}</b>
            <small>{service.duration}</small>
          </span>
        )}
      </li>
    );
  };

  return (
    <div className="picker" ref={rootRef} data-open={open}>
      <span className="picker__label" id={`${uid}-label`}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className="picker__button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${uid}-label ${uid}-value`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onButtonKey}
      >
        <span id={`${uid}-value`} className="picker__value">
          {selected ? (
            <>
              <span>{selected.title}</span>
              <small>
                {selected.format} · {selected.duration} · {formatPrice(selected.price)}
              </small>
            </>
          ) : (
            <span className="picker__placeholder">{emptyLabel}</span>
          )}
        </span>
        <svg className="picker__chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="picker__list"
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${uid}-label`}
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKey}
        >
          {row(null)}
          {groups.map((group) => (
            <li key={group.format} role="presentation" className="picker__group">
              <span className="picker__group-title" aria-hidden="true">
                {group.format}
              </span>
              <ul role="group" aria-label={group.format}>
                {group.items.map(row)}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
