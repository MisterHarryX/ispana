import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useOnce } from '../ui/Motion.tsx';
import { DIRECTION_ART } from './DirectionArt.tsx';

/**
 * Hand-drawn line illustrations for ISPANA. Every stroke has pathLength 1, so CSS can draw
 * it in (`.isp-art[data-draw] .d`) one after another (`--k`). Soft blobs sit behind in the
 * accent colour; small sparkles twinkle. All strokes use currentColor.
 */

export type DrawingId =
  | 'laser'
  | 'permanent'
  | 'brows'
  | 'lashes'
  | 'cosmetology'
  | 'massage'
  | 'removal'
  | 'booking'
  | 'coffee'
  | 'mirror'
  | 'care'
  | 'chat'
  | 'storefront'
  | 'armchair';

let k = 0;
/** A stroke that draws itself; `n` orders it in the sequence. */
const D = ({ d, n, w }: { d: string; n?: number; w?: number }) => (
  <path className="d" d={d} pathLength={1} style={{ '--k': n ?? k++, strokeWidth: w } as CSSProperties} />
);
const Spark = ({ x, y, s = 1, n = 0 }: { x: number; y: number; s?: number; n?: number }) => (
  <path
    className="spark"
    style={{ '--k': n } as CSSProperties}
    d={`M${x} ${y - 7 * s}l${1.6 * s} ${5.4 * s} ${5.4 * s} ${1.6 * s}-${5.4 * s} ${1.6 * s}-${1.6 * s} ${5.4 * s}-${1.6 * s}-${5.4 * s}-${5.4 * s}-${1.6 * s} ${5.4 * s}-${1.6 * s}z`}
  />
);
const Blob = ({ cx = 100, cy = 84, r = 62 }: { cx?: number; cy?: number; r?: number }) => (
  <ellipse className="blob" cx={cx} cy={cy} rx={r * 1.12} ry={r} />
);

const ART: Record<DrawingId, () => ReactNode> = {
  laser: () => (
    <>
      <Blob />
      <D n={0} d="M62 112 112 62a10 10 0 0 1 14 0l6 6a10 10 0 0 1 0 14l-50 50a8 8 0 0 1-11 0l-9-9a8 8 0 0 1 0-11Z" />
      <D n={1} d="M118 72l10 10M104 86l10 10" />
      <D n={2} d="M66 126c-18 16-38 12-40-8" />
      <D n={3} d="M138 56l18-18M146 68l22-6M130 48l6-22" />
      <D n={4} d="M162 92v22M152 97l20 12M152 109l20-12" />
      <Spark x={48} y={50} n={5} />
      <Spark x={170} y={140} s={0.7} n={6} />
    </>
  ),
  permanent: () => (
    <>
      <Blob />
      <D n={0} d="M38 96c30-32 82-42 124-26-34-2-74 6-116 30Z" />
      <D n={1} d="M60 86l7-11M76 79l6-11M92 74l5-11M108 70l4-10M124 68l3-9M140 68l2-7" />
      <D n={2} d="M112 136l46-46a6 6 0 0 1 8 0l4 4a6 6 0 0 1 0 8l-46 46ZM112 136l-9 9" />
      <D n={3} d="M150 98l8 8" />
      <Spark x={54} y={124} n={4} />
      <Spark x={172} y={46} s={0.8} n={5} />
    </>
  ),
  brows: () => (
    <>
      <Blob />
      <D n={0} d="M40 74c30-20 72-22 100-8" w={3} />
      <D n={1} d="M44 104c26-24 66-24 92 0-26 20-66 20-92 0Z" />
      <D n={2} d="M90 92a12 12 0 1 0 .1 0Z" />
      <circle className="dot" cx="90" cy="104" r="4.5" />
      <D n={3} d="M156 138l22-76" />
      <D n={4} d="M170 92l11 3M168 100l11 3M166 108l11 3M172 84l11 3M174 76l10 3" />
      <Spark x={40} y={42} s={0.8} n={5} />
    </>
  ),
  lashes: () => (
    <>
      <Blob />
      <D n={0} d="M50 60c30-16 72-16 102-2" />
      <D n={1} d="M46 90c26 24 82 24 108 0" w={2.4} />
      <D n={2} d="M58 100l-9 12M72 107l-5 15M88 111l-1 16M104 111l2 16M120 107l6 15M136 100l10 12" />
      <Spark x={164} y={44} n={3} />
      <Spark x={36} y={128} s={0.7} n={4} />
    </>
  ),
  cosmetology: () => (
    <>
      <Blob />
      <D n={0} d="M82 72h36v58a10 10 0 0 1-10 10H92a10 10 0 0 1-10-10Z" />
      <D n={1} d="M90 72V60h20v12M94 60V46a6 6 0 0 1 12 0v14" />
      <D n={2} d="M90 100h20M90 110h12" />
      <D n={3} d="M148 66s-11 13-11 20a11 11 0 0 0 22 0c0-7-11-20-11-20Z" />
      <D n={4} d="M56 92s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z" />
      <Spark x={156} y={120} n={5} />
      <Spark x={50} y={46} s={0.8} n={6} />
    </>
  ),
  massage: () => (
    <>
      <Blob />
      <D n={0} d="M58 122l44-44" w={3} />
      <D n={1} d="M128 58a26 26 0 1 0 .1 0Z" />
      <circle className="dot" cx="120" cy="74" r="2.4" />
      <circle className="dot" cx="132" cy="70" r="2.4" />
      <circle className="dot" cx="124" cy="86" r="2.4" />
      <circle className="dot" cx="138" cy="84" r="2.4" />
      <circle className="dot" cx="130" cy="98" r="2.4" />
      <D n={2} d="M36 138c20-10 40 10 60 0s40-10 60 0" />
      <D n={3} d="M160 98l14 6M164 84l16 2" />
      <Spark x={52} y={52} n={4} />
    </>
  ),
  removal: () => (
    <>
      <Blob />
      <D n={0} d="M100 72c10 0 14 10 6 14-10 6-22-4-16-14 8-14 30-8 30 8 0 20-28 26-38 10" />
      <D n={1} d="M78 94c-10-20 6-40 22-38M122 94c10-20-6-40-22-38" />
      <D n={2} d="M100 104v34M100 122c10-8 20-6 24 0-8 8-18 8-24 0Z" />
      <D n={3} d="M168 30l-40 40M176 50l-24 8M150 24l-6 22" />
      <Spark x={60} y={130} s={0.8} n={4} />
      <Spark x={146} y={118} s={0.6} n={5} />
    </>
  ),
  booking: () => (
    <>
      <Blob />
      <D n={0} d="M70 30h44a8 8 0 0 1 8 8v86a8 8 0 0 1-8 8H70a8 8 0 0 1-8-8V38a8 8 0 0 1 8-8Z" />
      <D n={1} d="M84 38h16" />
      <D n={2} d="M72 54h40M72 66h8M86 66h8M100 66h8M72 78h8M86 78h8M100 78h8" />
      <D n={3} d="M78 102l9 9 18-20" w={2.6} />
      <D n={4} d="M136 46h34a8 8 0 0 1 8 8v16a8 8 0 0 1-8 8h-22l-12 10V78a8 8 0 0 1-8-8V54a8 8 0 0 1 8-8Z" />
      <D n={5} d="M144 62h4M154 62h4M164 62h4" w={3} />
      <Spark x={44} y={56} n={6} />
    </>
  ),
  coffee: () => (
    <>
      <Blob cy={90} />
      <D n={0} d="M64 86h58v12a28 28 0 0 1-28 28h-2a28 28 0 0 1-28-28Z" />
      <D n={1} d="M122 92c15 0 15 22 0 22" />
      <D n={2} d="M48 136h90" />
      <g className="steam">
        <D n={3} d="M82 74c-7-8 7-14 0-24" />
        <D n={4} d="M98 74c-7-8 7-14 0-24" />
        <D n={5} d="M114 74c-7-8 7-14 0-24" />
      </g>
      <D n={6} d="M93 104c-3-4-9-1-6 4l6 6 6-6c3-5-3-8-6-4Z" />
      <Spark x={158} y={56} n={7} />
    </>
  ),
  mirror: () => (
    <>
      <Blob />
      <D n={0} d="M100 26c16 0 28 16 28 36s-12 36-28 36-28-16-28-36 12-36 28-36Z" />
      <D n={1} d="M100 98v28M78 132h44" />
      <D n={2} d="M86 50c4-8 10-12 18-12" />
      <D n={3} d="M142 134l26-50M164 92l8-16 4 2-6 16" />
      <Spark x={112} y={70} s={0.8} n={4} />
      <Spark x={46} y={58} n={5} />
    </>
  ),
  care: () => (
    <>
      <Blob />
      <D n={0} d="M84 74h32v56a8 8 0 0 1-8 8H92a8 8 0 0 1-8-8Z" />
      <D n={1} d="M92 74V62h16v12M100 62V50h20v6" />
      <D n={2} d="M92 98h16M92 108h10" />
      <D n={3} d="M138 128c0-30 20-44 36-48 0 24-14 44-36 48ZM138 128c8-14 18-28 32-40" />
      <D n={4} d="M56 66c-6-8-18-2-12 8l12 12 12-12c6-10-6-16-12-8Z" />
      <Spark x={160} y={44} s={0.8} n={5} />
    </>
  ),
  chat: () => (
    <>
      <Blob />
      <D n={0} d="M40 40h76a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H70l-16 14V90H40a10 10 0 0 1-10-10V50a10 10 0 0 1 10-10Z" />
      <D n={1} d="M48 60h56M48 72h36" />
      <D n={2} d="M98 104h62a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10h-6v12l-14-12H98a10 10 0 0 1-10-10v-16a10 10 0 0 1 10-10Z" />
      <D n={3} d="M110 122h4M124 122h4M138 122h4" w={3} />
      <Spark x={160} y={52} n={4} />
    </>
  ),
  storefront: () => (
    <>
      <Blob cx={100} cy={86} r={66} />
      <D n={0} d="M40 34h120v104H40Z" />
      <D n={1} d="M52 46h96v18H52Z" />
      <text className="sign" x="100" y="59.5" textAnchor="middle">ISPANA</text>
      <D n={2} d="M78 138V80h44v58M100 80v58" />
      <D n={3} d="M92 108h4M104 108h4" w={2.4} />
      <D n={4} d="M70 138h60l6 8H64Z" />
      <D n={5} d="M26 70a10 12 0 1 0 .1 0ZM16 84a9 11 0 1 0 .1 0ZM30 104q2 16-2 34M22 104q-2 16 4 34" />
      <D n={6} d="M174 70a10 12 0 1 0 .1 0ZM184 84a9 11 0 1 0 .1 0ZM172 104q-2 16 2 34M180 104q2 16-4 34" />
      <Spark x={100} y={20} n={7} />
    </>
  ),
  armchair: () => (
    <>
      <Blob />
      <D n={0} d="M60 92V64a22 22 0 0 1 22-22h36a22 22 0 0 1 22 22v28" />
      <D n={1} d="M48 92a10 10 0 0 1 20 0v14h64V92a10 10 0 0 1 20 0v24a8 8 0 0 1-8 8H56a8 8 0 0 1-8-8Z" />
      <D n={2} d="M62 124v12M138 124v12" />
      <D n={3} d="M164 70v-24M164 46c-8-2-12-10-8-14 6 0 10 6 8 14ZM164 52c8-4 12-12 8-16-6 2-10 8-8 16Z" />
      <Spark x={40} y={44} n={4} />
    </>
  ),
};

/** An illustration that draws itself the first time it comes into view (or when `active`). */
export function Drawing({ id, className = '', active, label }: { id: DrawingId; className?: string; active?: boolean; label?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const seen = useOnce(ref);
  k = 0;
  const on = active ?? seen;
  return (
    <svg
      ref={ref}
      className={`isp-art ${className}`}
      viewBox="0 0 200 160"
      data-draw={on || undefined}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {(DIRECTION_ART[id] ?? ART[id])()}
    </svg>
  );
}
