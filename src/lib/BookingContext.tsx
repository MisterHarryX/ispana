import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { OnlineBooking } from '../components/booking/OnlineBooking.tsx';

interface BookingState {
  serviceId: string | null;
  setServiceId: (id: string | null) => void;
  /** Opens online booking on the site, with a service already chosen when given. */
  requestBooking: (serviceId?: string) => void;
  /** Moves the visitor to the request form in the booking section instead. */
  scrollToForm: (serviceId?: string) => void;
}

const BookingContext = createContext<BookingState | null>(null);

export const BOOKING_ID = 'booking';

export function BookingProvider({ children }: { children: ReactNode }) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [online, setOnline] = useState<{ open: boolean; serviceId: string | null }>({ open: false, serviceId: null });

  const requestBooking = useCallback((id?: string) => {
    if (id) setServiceId(id);
    setOnline({ open: true, serviceId: id ?? null });
  }, []);

  const scrollToForm = useCallback((id?: string) => {
    if (id) setServiceId(id);
    const target = document.getElementById(BOOKING_ID);
    if (!target) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    history.replaceState(null, '', `#${BOOKING_ID}`);
    // Move focus to the heading so keyboard and screen-reader users land in the section.
    document.getElementById(`${BOOKING_ID}-title`)?.focus({ preventScroll: true });
  }, []);

  const value = useMemo(() => ({ serviceId, setServiceId, requestBooking, scrollToForm }), [serviceId, requestBooking, scrollToForm]);
  return (
    <BookingContext.Provider value={value}>
      {children}
      <OnlineBooking open={online.open} initialServiceId={online.serviceId} onClose={() => setOnline((o) => ({ ...o, open: false }))} />
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingState {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
