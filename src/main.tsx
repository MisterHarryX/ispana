import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Unicode-range subsets: browsers download only the Cyrillic/Latin files a page uses.
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/hero.css';
import './styles/sections.css';
import './styles/process.css';
import './styles/booking.css';
import './styles/nocturne.css';
import './styles/wheel.css';
import './styles/faq.css';
import './styles/motion.css';
import './styles/salon.css';
import './styles/location.css';
import './styles/refresh.css';
import './styles/ispana.css';
import './styles/ispana-motion.css';
import './styles/ispana-art.css';
import './styles/ispana-blocks.css';
import { App } from './App.tsx';
import { site } from './config/site.ts';
import { getContent } from './lib/api.ts';
import { applyOverrides } from './lib/overrides.ts';
import { rememberPristine } from './lib/pristine.ts';
import { startTracking } from './lib/tracker.ts';
import { hasPageEdits, setPageEdits } from './lib/liveLayer.ts';

/** Edits published in the panel are applied before the first paint; a slow API never holds the page long. */
async function boot() {
  const content = await getContent(700);
  rememberPristine(site, content);
  if (content) applyOverrides(site, content);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  requestAnimationFrame(() => {
    // Free texts, swapped and inserted photos are applied over the rendered page.
    if (content && hasPageEdits(content)) setPageEdits(content);
    startTracking();
  });
}

void boot();
