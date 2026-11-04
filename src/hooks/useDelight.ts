import { useEffect } from 'react';

/**
 * Small pleasures across the page: a soft pink light that trails the mouse, and a burst of
 * sparkles from every primary button press. Desktop light only; nothing under reduced motion.
 */
export function useDelight() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cleanups: (() => void)[] = [];

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const glow = document.createElement('div');
      glow.className = 'isp-cursor';
      glow.setAttribute('aria-hidden', 'true');
      document.body.append(glow);
      let x = innerWidth / 2;
      let y = innerHeight / 3;
      let tx = x;
      let ty = y;
      let frame = 0;
      const tick = () => {
        x += (tx - x) * 0.14;
        y += (ty - y) * 0.14;
        glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.4 ? requestAnimationFrame(tick) : 0;
      };
      const move = (e: PointerEvent) => {
        tx = e.clientX;
        ty = e.clientY;
        glow.dataset.on = 'true';
        if (!frame) frame = requestAnimationFrame(tick);
      };
      const leave = () => (glow.dataset.on = 'false');
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', leave);
        glow.remove();
      });
    }

    const burst = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest('.btn--primary, .isp-chip, .theme-toggle');
      if (!target) return;
      const n = 9;
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'isp-burst';
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        const dist = 26 + Math.random() * 26;
        s.style.left = `${e.clientX}px`;
        s.style.top = `${e.clientY}px`;
        s.style.setProperty('--bx', `${Math.cos(angle) * dist}px`);
        s.style.setProperty('--by', `${Math.sin(angle) * dist}px`);
        s.style.setProperty('--br', `${Math.random() * 180}deg`);
        document.body.append(s);
        s.addEventListener('animationend', () => s.remove(), { once: true });
      }
    };
    window.addEventListener('pointerdown', burst);
    cleanups.push(() => window.removeEventListener('pointerdown', burst));

    return () => cleanups.forEach((c) => c());
  }, []);
}
