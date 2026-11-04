/**
 * Pre-launch content check.
 *
 * Lists every development placeholder still present in src/config/site.ts.
 * Exits with code 1 when the site is marked `published` but placeholders remain,
 * so it can guard a deploy step: `npm run check:content && npm run build`.
 */
import { site } from '../src/config/site.ts';

const issues: string[] = [];
const add = (message: string) => issues.push(message);

if (site.practitioner.sample) add('practitioner: salon introduction is sample copy (practitioner.sample)');
if (!site.practitioner.portrait.src) add('practitioner.portrait.src: no photo — an empty image frame is shown in its place');
for (const service of site.services.items) {
  if (service.sample) add(`services.items["${service.id}"]: sample price ${service.price.amount} ${service.price.currency}`);
}
for (const contact of site.contacts) {
  if (contact.sample) add(`contacts["${contact.kind}"]: sample value "${contact.value}"`);
}
if (site.contacts.length === 0) add('contacts: no contact methods — visitors cannot book');
const sampleTestimonials = site.testimonials.items.filter((t) => t.sample).length;
if (site.sections.testimonials && sampleTestimonials > 0) {
  add(`testimonials: ${sampleTestimonials} sample item(s) — hidden when published; add genuine feedback or remove them`);
}
if (!site.meta.url) add('meta.url: production URL is empty (canonical link and og:url are omitted)');

const published = site.meta.status === 'published';
console.log(`Site status: ${site.meta.status}`);
if (issues.length === 0) {
  console.log('No placeholder content found.');
} else {
  console.log(`\n${issues.length} item(s) to replace before launch:\n`);
  for (const issue of issues) console.log(`  • ${issue}`);
}

if (published && issues.some((i) => !i.startsWith('meta.url') && !i.startsWith('testimonials'))) {
  console.error('\nThe site is marked "published" but still contains placeholder content.');
  process.exitCode = 1;
}
