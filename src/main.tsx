import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

import { ThemeProvider } from './context/ThemeContext';
import { TermProvider } from './context/TermContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <ThemeProvider>
            <TermProvider>
              <App />
            </TermProvider>
          </ThemeProvider>
        </AccessibilityProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>
);
