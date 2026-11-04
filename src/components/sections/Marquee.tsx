import { site } from '../../config/site.ts';

/**
 * A slow band of procedure names between the hero and the page. Pure CSS: the list is
 * repeated twice and slides by half its width; it stops under reduced motion.
 */
export function Marquee() {
  const words = site.marquee.words;
  if (!words.length) return null;
  const run = (hidden: boolean) => (
    <ul className="isp-marquee__run" aria-hidden={hidden || undefined}>
      {words.map((word) => (
        <li key={word}>
          <span>{word}</span>
          <span className="isp-marquee__dot" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className="isp-marquee" aria-label="Процедуры">
      <div className="isp-marquee__track">
        {run(false)}
        {run(true)}
      </div>
    </div>
  );
}
