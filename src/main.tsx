// Global styles first so component styles can override them.
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initInstallPrompt } from './lib/install';
import { requestPersistentStorage } from './lib/storage';
import { DecorProvider } from './state/Decor';
import { ToastProvider } from './state/Toast';
import { WorkoutStoreProvider } from './state/WorkoutStore';

initInstallPrompt();
requestPersistentStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorkoutStoreProvider>
      <DecorProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DecorProvider>
    </WorkoutStoreProvider>
  </StrictMode>,
);

// Service worker: production only (relative path → works under any GitHub Pages sub-folder).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is a bonus, never a blocker */
    });
  });
}
