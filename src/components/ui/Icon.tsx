import type { ContactKind } from '../../config/types.ts';

type IconName = ContactKind | 'copy' | 'route' | 'pin' | 'clock' | 'star';

const paths: Record<IconName, string> = {
  copy: 'M9 9h10v10H9zM5 15V5h10',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  telegram: 'M21 4 3 11l6 2 2 6 3-4 5 4 2-15ZM9 13l9-6-6.5 7.5',
  whatsapp: 'M20 11.5A8.5 8.5 0 0 1 7.6 19L4 20l1.1-3.5A8.5 8.5 0 1 1 20 11.5ZM9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2L9 8.5Z',
  email: 'M3 6h18v12H3zM3 7l9 6 9-6',
  booking: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3M8 17h6',
  vk: 'M3 7h3.5c.5 3 2 5.5 3.5 6V7h3v3.5c1.5-.3 3-2 3.5-3.5H20c-.5 2.5-2.5 4.5-4 5.3 1.7.8 3.5 2.6 4.5 4.7h-3.6c-.8-1.6-2.4-3-4.4-3.3V17h-1C7 17 3.5 13 3 7Z',
  max: 'M12 3a9 9 0 0 0-9 9c0 1.7.5 3.4 1.4 4.8L4 21l4.3-1.3A9 9 0 1 0 12 3ZM8 15V9l4 4 4-4v6',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 15V9a3 3 0 0 1 3-3h3M18 9v6a3 3 0 0 1-3 3h-3',
  pin: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  star: 'm12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3Z',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
