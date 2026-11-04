# Photo sources

All photographs belong to the salon ISPANA (Видное, Берёзовая ул., 12) and were taken at the
salon's opening on 17 October 2026. They were supplied by the salon for its website.
None of them are stock or generated.

| Local files | Used for |
| --- | --- |
| `team-line-*.webp` | Hero (large arch), link preview `og.png` |
| `doorway-*.webp` | Hero (round inset) |
| `team-group-*.webp` | «О салоне», «Как нас найти» |
| `team-cheer-*.webp`, `entrance-trio-*.webp` | «Наша команда», FAQ administrator card |

`favicon.svg`, `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — the ISPANA mark (arch, serif «I», sparkle) drawn for the site; the same mark is inline in the header and footer (`IspanaMark` in Header.tsx).

## Portraits and portfolio (taken 2026-11-04 from the salon's own pages)

| Local files | Used for | Source |
| --- | --- | --- |
| `../team/*.webp` | Master portraits (cropped to 4:5) | Master profiles on DIKIDI: https://dikidi.ru/125957 |
| `../works/lash-*`, `skin-*`, `face-clean-*` | «Наши работы» | «Примеры работ» on DIKIDI |
| `../works/salon-*` | «Салон внутри», «Как нас найти» | Salon gallery on DIKIDI |
| `../works/brows-*`, `lips-*`, `tattoo-removal-*` | «Наши работы» | Yandex Maps gallery, photos uploaded by the owner (Испаният Ибрагимова): https://yandex.ru/maps/org/ispana/104677977781/gallery/ |

To add or replace a work: put `<id>-480.webp` and `<id>-800.webp` into `public/works/` and list it
in `site.ts → works.items`. A master without `photo` gets a monogram instead of a portrait.
