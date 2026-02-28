import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/modern.css';
import './i18n';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}
console.log('[debug] main.tsx loaded');
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);