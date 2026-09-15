import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeLanguageProvider>
        <App />
      </ThemeLanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
