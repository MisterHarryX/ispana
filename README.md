# ISPANA — сайт салона красоты

A light, tender single-page website for the beauty salon ISPANA (Видное, Берёзовая ул., 12),
built on the engine of the «Ваша территория» site (github.com/MisterHarryX/site): the same
price list with search, online booking dialog, request form, Yandex map and admin panel —
with new content, two palettes — white / powder pink and dark rosewood, switched in the header (`src/lib/theme.ts`, saved per visitor, system preference by default) — and interactive sections: cross-fading hero photos with a glowing changing word, a fanned photo deck, a directions showcase, a one-screen portfolio, widening room panels, tilting offer cards, a scroll-drawn visit timeline, drifting review lanes and a searchable FAQ. Shared motion helpers live in `src/components/ui/Motion.tsx`.
Public copy is in Russian; code and docs are in English.

Stack: Vite 8 · React 19 · TypeScript 7 · plain CSS with custom properties.
Fonts: Cormorant Garamond (headings), IBM Plex Sans (body), Jost (wordmark and small caps), self-hosted via Fontsource.

## Run

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # type-check + production build into dist/
npm run preview        # serve dist/ locally
npm run check:content  # list placeholder content still to replace
```

## Where the content lives

| What | Where |
| --- | --- |
| Name, title, description, production URL, draft/published | `src/config/site.ts` → `meta` |
| Colours: both palettes are tokens at the top of `src/styles/ispana.css` (`:root` = white, `html[data-theme='dark']` = dark; `.isp-ink` and the footer are always dark) | `ispana.css`, `site.ts` → `theme` |
| Show or hide sections | `site.ts` → `sections` |
| Hero: headline with the changing italic word, lead, three figures | `site.ts` → `hero` |
| About the salon, advantages, «Что вас ждёт», figures, photo | `site.ts` → `practitioner` |
| Seven directions with «от … ₽» (the «Цены →» link filters the price list) | `site.ts` → `topics` |
| Current offers | `site.ts` → `promos` |
| Portfolio (12 works with a filter) and «Салон внутри» (4 rooms) | `site.ts` → `works`; files in `public/works/` |
| Team: name, role, services, online-booking directions, portrait | `site.ts` → `team`; portraits in `public/team/` |
| Services and prices (23 positions in 7 directions) | `site.ts` → `services` |
| Visit steps, reviews, FAQ, booking copy, contacts, address, map | `site.ts` |
| Photographs: files, alt text, crop focus | `src/config/photos.ts`; sources in `public/photos/CREDITS.md` |
| ISPANA styles (all `isp-*` classes and the light re-tint of shared parts) | `src/styles/ispana.css` |

Content sources (November 2026): Yandex Maps card (yandex.ru/maps/org/ispana/104677977781 —
prices, hours, reviews, features, news), DIKIDI (dikidi.ru/125957 — team, full price list, offers),
VK (vk.ru/pm_ispanka) and Telegram (t.me/Ispanaaa). Prices, offers and the rating are copied by
hand — update `services.items`, `promos.items` and `location.rating` when they change.

### Before publishing

1. Set `meta.url` to the production address.
2. Set `meta.status: 'published'` (removes the `noindex` tag).
3. Run `npm run check:content && npm run build`.

## Booking

Every «Записаться» button opens the four-step dialog on the site (procedure → master → day and time →
contacts); requests land in the panel at `/admin`. The booking section also links to the salon's
DIKIDI page, the phone, Telegram and VK. Working hours for the slot picker: 10:00–21:00 by default,
editable in the panel (Настройки).

## Salon panel (`/admin`) and storage

Unchanged from the base project: requests kanban, schedule, archive, statistics, settings and
live editing of texts and photos on the site. Set `ADMIN_PASSWORD` (and optionally `ADMIN_SECRET`,
`ADMIN_TZ`). On Vercel the data lives in Upstash Redis (`KV_REST_API_URL` / `KV_REST_API_TOKEN`);
every key of this site starts with `isp:`. Locally, without KV variables, it writes to `.data/`.

## Hosting

- Code: https://github.com/MisterHarryX/ispana (public). Pushing to `main` redeploys the site.
- Site, API and panel: Vercel project `ispana` (team `writelite`) → https://ispana.vercel.app, panel at `/admin`.
- Environment variables on Vercel: `ADMIN_PASSWORD` (the panel password, never committed), `ADMIN_SECRET`, `ADMIN_TZ`.
- Data: the team's Upstash Redis store is connected to the project; every key of this site starts with `isp:`.
- Locally: copy `.env.example` to `.env.local` and set `ADMIN_PASSWORD`; without Redis variables data goes to `.data/`.

## Reg.ru copy

`npm run build:regru -- https://domain` builds `regru/ispana-regru.zip` (static site + PHP proxy to the
Vercel API), as in the base project.
