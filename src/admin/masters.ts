import { site } from '../config/site.ts';

/** Masters who take bookings (those with price-list directions), in the site's order. */
export const MASTERS = site.team.items.filter((m) => m.formats?.length);

/** One colour per master, so the calendar reads at a glance; "any master" stays neutral. */
const COLORS = ['#C4A574', '#CF8E8E', '#7FB0A6', '#8FA9DB', '#DDA27A', '#AE92CF', '#B8C37C'];
const NEUTRAL = '#8A928C';

export function masterColor(id: string | null | undefined): string {
  const i = MASTERS.findIndex((m) => m.id === id);
  return i === -1 ? NEUTRAL : COLORS[i % COLORS.length];
}

export function masterName(id: string | null | undefined): string {
  return MASTERS.find((m) => m.id === id)?.name ?? site.team.items.find((m) => m.id === id)?.name ?? 'Любой мастер';
}

/** Short label for tight calendar blocks: «Вера», «Людмила». */
export const masterShort = (id: string | null | undefined) => masterName(id).split(' ')[0];
