import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useExperience } from './store/useExperience';
import './index.css';

// Dev-only handle for manual/automated inspection (stripped from prod builds).
if (import.meta.env.DEV) {
  (window as unknown as { experience?: unknown }).experience = useExperience;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
