import type { ContactKind, ContactMethod } from '../config/types.ts';

export const contactNames: Record<ContactKind, string> = {
  phone: 'Телефон',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  booking: 'Онлайн-запись',
  vk: 'ВКонтакте',
  max: 'MAX',
};

/** Whether the channel can receive the visitor's pre-filled message through its link. */
export const supportsPrefill: Record<ContactKind, boolean> = {
  phone: false,
  telegram: false,
  whatsapp: true,
  email: true,
  booking: false,
  vk: false,
  max: false,
};

export function contactHref(contact: ContactMethod, message?: string, subject?: string): string {
  const value = contact.value.trim();
  switch (contact.kind) {
    case 'phone':
      return `tel:+${value.replace(/\D/g, '')}`;
    case 'telegram':
      return `https://t.me/${value.replace(/^@/, '')}`;
    case 'whatsapp': {
      const phone = value.replace(/\D/g, '');
      return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
    }
    case 'email': {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (message) params.set('body', message);
      const query = params.toString().replace(/\+/g, '%20');
      return `mailto:${value}${query ? `?${query}` : ''}`;
    }
    case 'booking':
    case 'vk':
    case 'max':
      return value;
  }
}

/** Human-readable handle shown next to the button. */
export function contactDisplay(contact: ContactMethod): string {
  switch (contact.kind) {
    case 'telegram':
      return `@${contact.value.replace(/^@/, '')}`;
    case 'booking':
      if (contact.value.startsWith('#')) return 'прямо на сайте';
      // Booking services put the company in a subdomain ("n2332191.yclients.com"): show the service only.
      try {
        return new URL(contact.value).hostname.replace(/^(www|n\d+)\./, '');
      } catch {
        return contact.value.replace(/^https?:\/\//, '').replace(/\/$/, '');
      }
    case 'vk':
    case 'max':
      try {
        const url = new URL(contact.value);
        return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}`;
      } catch {
        return contact.value;
      }
    default:
      return contact.value;
  }
}

export const isExternal = (contact: ContactMethod) => contact.kind !== 'email' && contact.kind !== 'phone' && !contact.value.startsWith('#');
