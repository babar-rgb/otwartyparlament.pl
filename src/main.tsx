import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { ThemeProvider } from './context/ThemeContext';
import { TermProvider } from './context/TermContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TermProvider>
        <App />
      </TermProvider>
    </ThemeProvider>
  </StrictMode>
);
