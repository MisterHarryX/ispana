import type { CSSProperties, ReactNode } from 'react';

/**
 * Detailed illustrations for the seven directions. Same drawing rules as Drawings.tsx:
 * strokes (`.d`, pathLength 1) draw in order of `n`, tinted shapes (`.fill`) fade in under
 * them, dots and sparkles appear last.
 */

const D = ({ d, n, w }: { d: string; n: number; w?: number }) => (
  <path className="d" d={d} pathLength={1} style={{ '--k': n, strokeWidth: w } as CSSProperties} />
);
const F = ({ d }: { d: string }) => <path className="fill" d={d} />;
const Dots = ({ pts, r = 1.6, light = false }: { pts: [number, number][]; r?: number; light?: boolean }) => (
  <>
    {pts.map(([x, y], i) => (
      <circle key={i} className={light ? 'dot dot--light' : 'dot'} cx={x} cy={y} r={r} style={{ '--k': i } as CSSProperties} />
    ))}
  </>
);
const Spark = ({ x, y, s = 1, n = 0 }: { x: number; y: number; s?: number; n?: number }) => (
  <path
    className="spark"
    style={{ '--k': n } as CSSProperties}
    d={`M${x} ${y - 7 * s}l${1.6 * s} ${5.4 * s} ${5.4 * s} ${1.6 * s}-${5.4 * s} ${1.6 * s}-${1.6 * s} ${5.4 * s}-${1.6 * s}-${5.4 * s}-${5.4 * s}-${1.6 * s} ${5.4 * s}-${1.6 * s}z`}
  />
);
const Blob = () => <ellipse className="blob" cx={100} cy={84} rx={70} ry={62} />;

export const DIRECTION_ART: Record<string, () => ReactNode> = {
  laser: () => (
    <>
      <Blob />
      {/* console on wheels with a screen and dials */}
      <F d="M30 90h44a6 6 0 0 1 6 6v42H24V96a6 6 0 0 1 6-6Z" />
      <D n={0} d="M30 90h44a6 6 0 0 1 6 6v42H24V96a6 6 0 0 1 6-6Z" />
      <D n={1} d="M32 98h28v16H32ZM36 104h12M36 109h18" w={1.4} />
      <D n={2} d="M70 102a3 3 0 1 0 .1 0ZM70 113a3 3 0 1 0 .1 0ZM32 124h40M32 130h40" w={1.4} />
      <D n={3} d="M30 138v6M74 138v6M26 146h8M70 146h8" />
      {/* coiled cable up to the handpiece */}
      <D n={4} d="M58 90c-2-14 4-24 14-26 8-2 10 6 4 8s-6-8 2-10c10-3 18 0 26-6" w={1.6} />
      {/* handpiece with grip rings and a crystal window */}
      <F d="M104 74l30-30a9 9 0 0 1 13 0l5 5a9 9 0 0 1 0 13l-30 30a6 6 0 0 1-8 0l-10-10a6 6 0 0 1 0-8Z" />
      <D n={5} d="M104 74l30-30a9 9 0 0 1 13 0l5 5a9 9 0 0 1 0 13l-30 30a6 6 0 0 1-8 0l-10-10a6 6 0 0 1 0-8Z" />
      <D n={6} d="M112 80l8 8M118 74l8 8M124 68l8 8" w={1.3} />
      <D n={7} d="M144 46l10 10" w={3} />
      {/* light beams and the skin it touches */}
      <D n={8} d="M158 40l14-14M162 52l22-4M148 34l4-22" w={1.6} />
      <D n={9} d="M150 152c8-24 22-38 44-44" />
      <Dots pts={[[168, 128], [176, 122], [184, 118], [172, 136], [181, 131]]} r={1.3} />
      {/* frost: the crio cooling */}
      <D n={10} d="M164 82v22M154 87l20 12M154 99l20-12M161 84l3 3 3-3M161 102l3-3 3 3" w={1.4} />
      <Spark x={46} y={52} n={11} />
      <Spark x={134} y={20} s={0.6} n={12} />
    </>
  ),
  permanent: () => (
    <>
      <Blob />
      {/* brow with fine hair strokes */}
      <F d="M40 80c22-24 66-30 94-16-28-2-58 6-90 24Z" />
      <D n={0} d="M40 80c22-24 66-30 94-16-28-2-58 6-90 24Z" />
      <D n={1} d="M52 76l6-9M62 71l6-10M73 67l5-10M84 64l5-10M95 62l4-9M106 61l3-8M117 61l3-7" w={1.1} />
      {/* eye with lashes and a highlight */}
      <D n={2} d="M50 108c18-16 48-16 66 0-18 14-48 14-66 0Z" />
      <D n={3} d="M83 98a10 10 0 1 0 .1 0Z" />
      <Dots pts={[[83, 108]]} r={4.2} />
      <Dots pts={[[86, 105]]} r={1.4} light />
      <D n={4} d="M56 103l-5-6M65 99l-3-7M76 96l-1-8M88 96l1-8M99 98l3-7M109 102l5-6" w={1.2} />
      {/* tattoo machine: body, grip, needle and cord */}
      <F d="M126 136l38-38a6 6 0 0 1 8 0l4 4a6 6 0 0 1 0 8l-38 38Z" />
      <D n={5} d="M126 136l38-38a6 6 0 0 1 8 0l4 4a6 6 0 0 1 0 8l-38 38Z" />
      <D n={6} d="M136 126l8 8M142 120l8 8M148 114l8 8" w={1.2} />
      <D n={7} d="M126 136l-12 12" w={1.4} />
      <D n={8} d="M174 100c10-6 14-20 8-32-4-8 0-16 8-18" w={1.4} />
      {/* pigment cups */}
      <F d="M28 138a9 4.5 0 1 0 .1 0Z" />
      <D n={9} d="M28 138a9 4.5 0 1 0 .1 0ZM50 142a8 4 0 1 0 .1 0ZM72 144a7 3.5 0 1 0 .1 0Z" w={1.4} />
      <Spark x={154} y={56} s={0.8} n={10} />
      <Spark x={30} y={44} s={0.7} n={11} />
    </>
  ),
  brows: () => (
    <>
      <Blob />
      {/* shaped brow: filled body and hairs */}
      <F d="M36 72c26-24 74-28 102-12-30-4-62 4-98 22Z" />
      <D n={0} d="M36 72c26-24 74-28 102-12-30-4-62 4-98 22Z" />
      <D n={1} d="M48 70l5-10M58 64l5-10M68 60l5-10M80 57l4-10M92 55l4-9M104 55l3-8M116 56l2-7M126 58l2-5" w={1.1} />
      {/* mapping lines: the architecture of the brow */}
      <D n={2} d="M44 40v42M88 34v30M132 40v26" w={0.9} />
      <Dots pts={[[44, 40], [88, 34], [132, 40]]} r={2} />
      {/* eye, crease, iris and lashes */}
      <D n={3} d="M46 100c26-20 66-20 92 0" w={1.2} />
      <D n={4} d="M50 112c22-18 62-18 84 0-22 16-62 16-84 0Z" />
      <D n={5} d="M92 101a11 11 0 1 0 .1 0Z" />
      <Dots pts={[[92, 112]]} r={4.4} />
      <Dots pts={[[95, 109]]} r={1.4} light />
      <D n={6} d="M56 107l-5-6M66 103l-3-7M78 100l-1-8M106 100l1-8M118 103l3-7M128 107l5-6" w={1.2} />
      {/* spoolie and tweezers */}
      <D n={7} d="M150 146l20-72" w={2.4} />
      <D n={8} d="M164 96l11 3M162 104l11 3M160 112l11 3M166 88l11 3M168 80l10 3" w={1.2} />
      <D n={9} d="M180 20l6 58M192 20l-4 58M186 78l1 6" w={1.4} />
      <Spark x={30} y={128} s={0.8} n={10} />
    </>
  ),
  lashes: () => (
    <>
      <Blob />
      <D n={0} d="M48 52c30-16 74-16 104-2" w={2.2} />
      <D n={1} d="M48 62c30-12 74-12 104 0" w={0.9} />
      {/* closed lid with long curled lashes */}
      <D n={2} d="M44 88c28 26 84 26 112 0" w={2.4} />
      <D n={3} d="M54 96c-4 8-12 12-20 12M64 102c-2 9-8 15-16 18M76 106c-1 10-4 18-10 22M90 108c0 11-1 19-4 24M104 108c1 11 3 19 7 24M118 106c2 10 6 18 12 22M132 101c3 9 9 15 17 18M144 95c5 8 12 12 20 12" w={1.4} />
      {/* a tile of lashes for extensions, with tweezers */}
      <F d="M104 138h68v14h-68Z" />
      <D n={4} d="M104 138h68v14h-68Z" w={1.2} />
      <D n={5} d="M110 150c0-5 2-8 5-10M120 150c0-5 2-8 5-10M130 150c0-5 2-8 5-10M140 150c0-5 2-8 5-10M150 150c0-5 2-8 5-10M160 150c0-5 2-8 5-10" w={1} />
      <D n={6} d="M30 150l34-30M38 154l30-30M64 120l4-4" w={1.4} />
      <Spark x={166} y={32} n={7} />
      <Spark x={36} y={70} s={0.6} n={8} />
    </>
  ),
  cosmetology: () => (
    <>
      <Blob />
      {/* face in profile, hair, closed eye */}
      <D n={0} d="M76 26c-22 8-32 30-26 50l-8 12 9 4-3 9c4 6 12 7 18 4 3 12 12 21 26 24" />
      <D n={1} d="M76 26c30-12 64 4 70 40 4 30-8 58-30 72" />
      <D n={2} d="M62 62c4 3 9 3 13 0M58 58c3-2 6-3 9-3" w={1.2} />
      {/* glow on the cheek */}
      <Dots pts={[[84, 78], [92, 72], [96, 84], [88, 90], [102, 76]]} r={1.5} />
      {/* dropper with a falling drop */}
      <D n={3} d="M120 14v10M114 24h12v6h-12ZM116 30h8l-1 22h-6Z" w={1.4} />
      <D n={4} d="M120 58s-5 6-5 9a5 5 0 0 0 10 0c0-3-5-9-5-9Z" w={1.4} />
      {/* jar of cream with a lid and a swirl */}
      <F d="M140 116h40v22a6 6 0 0 1-6 6h-28a6 6 0 0 1-6-6Z" />
      <D n={5} d="M140 116h40v22a6 6 0 0 1-6 6h-28a6 6 0 0 1-6-6ZM137 106h46v10h-46Z" />
      <D n={6} d="M150 128c4-4 10-4 14 0s10 4 14 0" w={1.2} />
      {/* a leaf: the natural ingredients */}
      <D n={7} d="M26 140c4-20 18-30 34-30-2 18-16 30-34 30ZM26 140c8-10 18-18 30-24" w={1.4} />
      <Spark x={160} y={84} n={8} />
      <Spark x={36} y={30} s={0.7} n={9} />
    </>
  ),
  massage: () => (
    <>
      <Blob />
      {/* waist and hips */}
      <D n={0} d="M44 24c10 24 10 44-2 64 16 14 24 34 20 64" />
      <D n={1} d="M98 24c-6 22-6 44 4 62-12 16-16 38-12 66" />
      <D n={2} d="M62 96c8 4 18 4 26 0" w={1} />
      {/* sphere roller: a cylinder of spheres on a handle */}
      <D n={3} d="M134 150l18-50" w={3} />
      <F d="M126 64h52a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-52a8 8 0 0 1-8-8V72a8 8 0 0 1 8-8Z" />
      <D n={4} d="M126 64h52a8 8 0 0 1 8 8v20a8 8 0 0 1-8 8h-52a8 8 0 0 1-8-8V72a8 8 0 0 1 8-8Z" />
      <D n={5} d="M132 76a5 5 0 1 0 .1 0ZM146 76a5 5 0 1 0 .1 0ZM160 76a5 5 0 1 0 .1 0ZM174 76a5 5 0 1 0 .1 0ZM139 88a5 5 0 1 0 .1 0ZM153 88a5 5 0 1 0 .1 0ZM167 88a5 5 0 1 0 .1 0Z" w={1.1} />
      <D n={6} d="M152 100v6" w={2} />
      {/* EMS impulses and motion */}
      <D n={7} d="M108 132l6-10 6 10 6-10 6 10" w={1.4} />
      <D n={8} d="M112 52c10-8 22-10 34-8M150 40c10 0 20 4 26 10" w={1.2} />
      <Spark x={30} y={110} s={0.8} n={9} />
      <Spark x={186} y={130} s={0.6} n={10} />
    </>
  ),
  removal: () => (
    <>
      <Blob />
      {/* forearm */}
      <D n={0} d="M20 120c40-8 90-14 160-30M24 150c44-10 96-20 162-32" />
      {/* the rose: the left half still drawn, the right half fading to dots */}
      <D n={1} d="M84 118c-6-2-8-8-4-12 4-3 10-1 10 4 0 6-8 9-12 5" w={1.3} />
      <D n={2} d="M72 120c-6-10 0-22 12-22 10 0 16 8 14 16" w={1.3} />
      <D n={3} d="M78 128c-12-2-18-12-12-22M86 128l-6 14M80 136c-6-2-10 0-12 4 6 2 10 0 12-4Z" w={1.3} />
      <Dots pts={[[104, 112], [108, 120], [102, 126], [112, 106], [114, 116], [118, 124], [110, 130]]} r={1.2} />
      {/* laser beam */}
      <D n={4} d="M164 22l-42 76" w={2.2} />
      <D n={5} d="M152 28l12-6 6 10-12 6ZM176 36l-6 12M182 22l-12 4" w={1.4} />
      <D n={6} d="M114 98a8 8 0 1 0 16 0a8 8 0 1 0-16 0" w={1} />
      <Spark x={130} y={86} s={0.9} n={7} />
      <Spark x={44} y={60} s={0.7} n={8} />
    </>
  ),
};
