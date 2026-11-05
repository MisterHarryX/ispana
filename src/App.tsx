import { site } from './config/site.ts';
import { BookingProvider } from './lib/BookingContext.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { Header, type NavItem } from './components/layout/Header.tsx';
import { About } from './components/sections/About.tsx';
import { Booking } from './components/sections/Booking.tsx';
import { Faq } from './components/sections/Faq.tsx';
import { Hero } from './components/sections/Hero.tsx';
import { Location } from './components/sections/Location.tsx';
import { Marquee } from './components/sections/Marquee.tsx';
import { Process } from './components/sections/Process.tsx';
import { Promos } from './components/sections/Promos.tsx';
import { Services } from './components/sections/Services.tsx';
import { Testimonials, visibleTestimonials } from './components/sections/Testimonials.tsx';
import { Team } from './components/sections/Team.tsx';
import { Topics } from './components/sections/Topics.tsx';
import { Works } from './components/sections/Works.tsx';
import { ImageViewerProvider } from './components/ui/ImageViewer.tsx';
import { PaletteSwitcher } from './components/ui/PaletteSwitcher.tsx';
import { useScrollReveal } from './hooks/useScrollReveal.ts';
import { useDelight } from './hooks/useDelight.ts';

export function App() {
  const { sections } = site;
  useScrollReveal();
  useDelight();
  const showTestimonials = sections.testimonials && visibleTestimonials().length > 0;

  const nav: NavItem[] = [
    sections.about && { href: '#about', label: 'О салоне' },
    sections.topics && { href: '#topics', label: 'Услуги' },
    sections.works && { href: '#works', label: 'Работы' },
    sections.team && { href: '#team', label: 'Команда' },
    sections.services && { href: '#services', label: 'Цены' },
    showTestimonials && { href: '#testimonials', label: 'Отзывы' },
    sections.faq && { href: '#faq', label: 'Вопросы' },
    sections.location && { href: '#location', label: 'Контакты' },
  ].filter((item): item is NavItem => Boolean(item));

  return (
    <BookingProvider>
      <ImageViewerProvider>
        <a className="skip-link" href="#main">
          Перейти к содержанию
        </a>
        <Header nav={nav} />
        <main id="main" tabIndex={-1}>
          <Hero />
          <Marquee />
          {sections.about && <About />}
          {sections.topics && <Topics />}
          {sections.works && <Works />}
          {sections.promos && <Promos />}
          {sections.team && <Team />}
          {sections.services && <Services />}
          {sections.process && <Process />}
          {showTestimonials && <Testimonials />}
          {sections.faq && <Faq />}
          <Booking />
          {sections.location && <Location />}
        </main>
        <Footer nav={nav} />
        <PaletteSwitcher />
      </ImageViewerProvider>
    </BookingProvider>
  );
}
