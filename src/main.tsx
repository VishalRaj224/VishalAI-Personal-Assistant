import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite WebSocket connection errors when HMR is intentionally disabled by the environment.
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('failed to connect to websocket') ||
      args[0].includes('WebSocket connection to') ||
      args[0].includes('[vite] server connection lost'))
  ) {
    return;
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
