import { useEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

/** Hover must rest this long before a card turns, so passing the mouse over a row does not spin it. */
const HOVER_IN_MS = 260;
const HOVER_OUT_MS = 220;

/**
 * A card with a front and a back that turns over in 3D, slowly and softly. Controlled:
 * the parent decides when it is turned (a resting hover on desktop, a tap on touch
 * screens, the small button from the keyboard). Links on the back keep working.
 */
export function FlipCard({
  front,
  back,
  flipped,
  onFlip,
  label,
  className = '',
  style,
  hover = true,
}: {
  front: ReactNode;
  back: ReactNode;
  flipped: boolean;
  onFlip: (next: boolean) => void;
  label: string;
  className?: string;
  style?: CSSProperties;
  /** Turn on a resting mouse hover (desktop only). */
  hover?: boolean;
}) {
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const later = (value: boolean, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onFlip(value), ms);
  };
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button:not(.flip__turn), input')) return;
    window.clearTimeout(timer.current);
    onFlip(!flipped);
  };

  return (
    <div
      className={`flip ${className}`}
      data-flipped={flipped || undefined}
      style={style}
      onClick={onClick}
      onPointerEnter={(e) => hover && e.pointerType === 'mouse' && later(true, HOVER_IN_MS)}
      onPointerLeave={(e) => hover && e.pointerType === 'mouse' && later(false, HOVER_OUT_MS)}
    >
      <div className="flip__inner">
        <div className="flip__face flip__front" aria-hidden={flipped}>
          {front}
        </div>
        <div className="flip__face flip__back" aria-hidden={!flipped} inert={!flipped}>
          {back}
        </div>
      </div>
      <button
        type="button"
        className="flip__turn"
        aria-pressed={flipped}
        aria-label={flipped ? `Вернуть фото: ${label}` : `Перевернуть: ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          window.clearTimeout(timer.current);
          onFlip(!flipped);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
        </svg>
      </button>
    </div>
  );
}
