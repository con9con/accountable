import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

registerSW({
  onRegisteredSW(_swUrl, registration) {
    // Check for updates every hour
    if (registration) {
      setInterval(() => registration.update(), 60 * 60 * 1000);
    }
  },
});

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
);
