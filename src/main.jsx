import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initGoogleTranslate } from './lib/translations.js';

// Initialize hidden Google Translate widget
initGoogleTranslate();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
