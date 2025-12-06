import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

import { ThemeProvider } from './context/ThemeContext';
import { TermProvider } from './context/TermContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ... */}
    <HelmetProvider>
      <ThemeProvider>
        <TermProvider>
          <App />
        </TermProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>
);
