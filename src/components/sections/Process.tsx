import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { useReducedMotion } from '../../hooks/useReducedMotion.ts';
import { SectionHeading } from '../ui/SectionHeading.tsx';
import { Drawing, type DrawingId } from '../art/Drawings.tsx';

/**
 * Four steps on a line that fills as the section scrolls past the middle of the screen;
 * each step lights up and draws its icon when the line reaches it.
 */
export function Process() {
  const { process } = site;
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = listRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the list enters at 85% of the screen height, 1 when it reaches 35%.
      const p = (vh * 0.85 - r.top) / (vh * 0.5);
      setProgress(Math.max(0, Math.min(1, p)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [reduced]);

  const n = process.steps.length;

  return (
    <section id="process" className="section isp-process" aria-labelledby="process-title">
      <div className="wrap">
        <SectionHeading id="process-title" title={process.title} lead={process.lead} className="isp-heading--center" />
        <ol ref={listRef} className="isp-process__steps" style={{ '--p': progress } as CSSProperties}>
          <span className="isp-process__line" aria-hidden="true">
            <span />
          </span>
          {process.steps.map((step, i) => {
            const on = progress >= (n === 1 ? 0 : i / (n - 1)) - 0.02;
            return (
              <li key={step.title} className="isp-step" data-on={on || undefined}>
                <span className="isp-step__dot" aria-hidden="true">
                  <Drawing id={step.drawing as DrawingId} active={on} className="isp-step__art" />
                  <b>{i + 1}</b>
                </span>
                <h3 className="isp-step__title">{step.title}</h3>
                <p className="isp-step__text">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
