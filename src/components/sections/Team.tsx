import { useRef, type CSSProperties } from 'react';
import { site } from '../../config/site.ts';
import { BookingLink } from '../ui/BookingLink.tsx';
import { FlipCard } from '../ui/FlipCard.tsx';
import { useInView } from '../../hooks/useInView.ts';
import { useFlipTour } from '../../hooks/useFlipTour.ts';
import { SectionHeading } from '../ui/SectionHeading.tsx';

/**
 * The team: every master as a card that turns over to their services and a booking button.
 * A master with `photo` gets an arched portrait; the rest get a monogram.
 */
export function Team() {
  const { team } = site;
  const gridRef = useRef<HTMLUListElement>(null);
  const inView = useInView(gridRef, '-25% 0px');
  const { isFlipped, set } = useFlipTour(team.items.length, inView, { every: 2600, hold: 1700 });

  return (
    <section id="team" className="section isp-team" aria-labelledby="team-title">
      <div className="wrap">
        <SectionHeading id="team-title" title={team.title} lead={team.lead} className="isp-heading--center">
          <p className="isp-team__hint">Наведите на мастера или нажмите — карточка перевернётся</p>
        </SectionHeading>

        <ul ref={gridRef} className="isp-team__grid">
          {team.items.map((master, i) => (
            <li key={master.id} className="isp-reveal" style={{ '--i': i } as CSSProperties}>
              <FlipCard
                className="isp-master"
                label={master.name}
                flipped={isFlipped(i)}
                onFlip={(v) => set(i, v)}
                front={
                  <>
                    <span className="isp-master__portrait">
                      {master.photo ? (
                        <img src={master.photo} alt={`${master.name} — ${master.role.toLowerCase()}`} width={432} height={540} loading="lazy" decoding="async" />
                      ) : (
                        <span className="isp-master__avatar">{master.name[0]}</span>
                      )}
                    </span>
                    <h3 className="isp-master__name">{master.name}</h3>
                    <p className="isp-master__role">{master.role}</p>
                  </>
                }
                back={
                  <div className="isp-master__back">
                    {master.photo && <img className="isp-master__mini" src={master.photo} alt="" loading="lazy" decoding="async" />}
                    <strong>{master.name}</strong>
                    <span className="isp-master__role">{master.role}</span>
                    <ul className="isp-master__services">
                      {master.services.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <BookingLink className="btn--compact">Записаться к мастеру</BookingLink>
                  </div>
                }
              />
            </li>
          ))}
        </ul>

        <p className="isp-team__note isp-reveal">
          {team.note} <BookingLink variant="link">Записаться к мастеру</BookingLink>
        </p>
      </div>
    </section>
  );
}
