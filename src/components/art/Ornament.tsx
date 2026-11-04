import { sparklePath } from './svgUtils.ts';

/** Four-point star — the template's decorative motif. */
export function StarGlyph({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={sparklePath(12, 12, 12, 0.14)} fill="currentColor" />
    </svg>
  );
}

/** Crescent with a small star — the brand mark. */
export function CrescentMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M19 4a12.5 12.5 0 1 0 8 19.6A10.5 10.5 0 1 1 19 4Z" fill="currentColor" />
      <path d={sparklePath(23, 10, 4.5)} fill="var(--c-ivory)" />
    </svg>
  );
}
