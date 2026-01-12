import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

import { ThemeProvider } from './context/ThemeContext';
import { TermProvider } from './context/TermContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ... */}
    <HelmetProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <TermProvider>
            <App />
          </TermProvider>
        </ThemeProvider>
      </AccessibilityProvider>
    </HelmetProvider>
  </StrictMode>
);
