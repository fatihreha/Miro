import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';

// Initialize Sentry BEFORE React
Sentry.init({
  dsn: "https://fc64dff2b9a75df599f385033bac126f@o4510438928941056.ingest.de.sentry.io/4510439049003088",

  // Environment (development/production)
  environment: (import.meta as any).env?.MODE || 'development',

  // Performance Monitoring
  tracesSampleRate: 0.2, // 20% of transactions

  // PII (Personally Identifiable Information)
  sendDefaultPii: true,

  // Don't send errors in development
  beforeSend(event, hint) {
    const mode = (import.meta as any).env?.MODE || 'development';
    if (mode === 'development') {
      console.error('Sentry Error (not sent in dev):', hint.originalException || event);
      return null; // Don't send to Sentry in dev
    }
    return event;
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);