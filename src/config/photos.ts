import type { Photo, PhotoId } from './types.ts';

/**
 * Photograph registry: files, intrinsic sizes, alt text and crop focus.
 * All photographs are the salon's own, from the opening day (17 October 2026);
 * sources are recorded in public/photos/CREDITS.md.
 *
 * To replace a photo: add `${name}-${width}.webp` files to public/photos,
 * update the entry, and set `focus` so the subject survives narrow crops.
 */
const own = { author: 'Салон красоты ISPANA', url: 'https://vk.ru/pm_ispanka', license: 'Фото салона' };

const photo = (src: string, alt: string, focus: string): Photo => ({
  src: `/photos/${src}`,
  widths: [640, 853],
  format: 'webp',
  width: 853,
  height: 1280,
  alt,
  focus,
  credit: own,
});

export const photos: Record<PhotoId, Photo> = {
  entrance: photo('entrance-trio', 'Три мастера ISPANA в светлых костюмах у входа в салон, рядом букеты нежно-розовых шаров', '55% 45%'),
  cheer: photo('team-cheer', 'Команда ISPANA радуется на ступенях салона в день открытия', '50% 55%'),
  group: photo('team-group', 'Команда ISPANA у входа: вывеска салона и розовые шары', '50% 55%'),
  doorway: photo('doorway', 'Мастера ISPANA выглядывают из дверей салона и улыбаются', '45% 55%'),
  reception: {
    src: '/works/salon-reception', widths: [480, 768], format: 'webp', width: 768, height: 1024,
    alt: 'Стойка администратора ISPANA: светлый интерьер, кресло и неоновая подсветка', focus: '50% 55%',
    credit: { author: 'Салон красоты ISPANA', url: 'https://dikidi.ru/125957', license: 'Фото салона' },
  },
  line: photo('team-line', 'Вся команда ISPANA стоит в ряд на ступенях у входа в салон', '50% 58%'),
};
