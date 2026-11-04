import type { PointerEvent } from 'react';
import type { Photo } from '../../config/types.ts';
import { useImageViewer } from './ImageViewer.tsx';

interface PhotoFrameProps {
  photo: Photo;
  /** `sizes` attribute describing the rendered width. */
  sizes: string;
  className?: string;
  /** Above-the-fold photos load eagerly with high priority. */
  priority?: boolean;
  /** Scroll-linked reveal as the photo enters the viewport (CSS only; no hidden state without support). */
  reveal?: boolean;
  /** Overrides the registry focal point for a specific crop. */
  focus?: string;
}

export function srcSet(photo: Photo): string {
  return photo.widths.map((w) => `${photo.src}-${w}.${photo.format} ${w}w`).join(', ');
}

export function photoSrc(photo: Photo, index = photo.widths.length - 1): string {
  return `${photo.src}-${photo.widths[index]}.${photo.format}`;
}

/** A photograph in a rounded frame. No captions or credits are shown on the page. */
export function PhotoFrame({ photo, sizes, className = '', priority = false, reveal = true, focus }: PhotoFrameProps) {
  const open = useImageViewer();
  return (
    <button type="button" className={`photo photo--interactive${reveal ? ' photo--reveal' : ''} ${className}`}
      onClick={() => open([{ src: photoSrc(photo), title: photo.alt }])} aria-label={`Открыть фото: ${photo.alt}`}>
      <img
        src={photoSrc(photo)}
        srcSet={srcSet(photo)}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        style={{ objectPosition: focus ?? photo.focus }}
      />
      <span className="photo__expand" aria-hidden="true">Рассмотреть ↗</span>
    </button>
  );
}

/** Empty image slot, used where the practitioner has not supplied a photo yet. */
export function EmptyImage({
  className = '',
  label,
  onPointerMove,
  slot,
}: {
  className?: string;
  label: string;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  /** Named slot the live editor can fill with a photo ("portrait"). */
  slot?: string;
}) {
  return <div className={`photo photo--empty ${className}`} role="img" aria-label={label} onPointerMove={onPointerMove} data-media-slot={slot} />;
}
