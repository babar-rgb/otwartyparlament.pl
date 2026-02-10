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

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<h1 style="color:red; padding:20px;">CRITICAL ERROR: Root element #root not found!</h1>';
} else {
  try {
    createRoot(rootElement).render(
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
  } catch (err: any) {
    rootElement.innerHTML = `<div style="color:red; padding:20px; font-family:sans-serif;">
      <h1>Application Initialization Failed</h1>
      <pre>${err?.message || err}</pre>
      <pre>${err?.stack}</pre>
    </div>`;
  }
}

// Global error listener for unhandled errors
window.onerror = (msg, url, line, col, error) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `<div style="color:red; padding:20px; font-family:sans-serif; border: 4px solid red; background: #fff1f1;">
      <h1 style="margin-top:0;">Global Error Detected</h1>
      <p><b>Message:</b> ${msg}</p>
      <p><b>Location:</b> ${url}:${line}:${col}</p>
      <pre style="background:#eee; padding:10px; overflow:auto;">${error?.stack || 'No stack trace available'}</pre>
      <p>This typically means a module failed to load or a top-level initialization failed.</p>
    </div>`;
  }
};

// Global error listener for unhandled promise rejections
window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event.reason);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = "color:darkred; padding:10px; background:#ffe; border:2px dimgray solid; margin:10px;";
    errorDiv.innerHTML = `<h3>Unhandled Promise Rejection</h3><pre>${event.reason?.stack || event.reason}</pre>`;
    rootElement.appendChild(errorDiv);
  }
};
