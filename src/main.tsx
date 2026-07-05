import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useExperience } from './store/useExperience';
import './index.css';

// Dev-only handles for manual/automated inspection (stripped from prod builds).
// __advance(t) steps R3F one frame — lets tooling render in backgrounded tabs
// where requestAnimationFrame is paused.
if (import.meta.env.DEV) {
  (window as unknown as { experience?: unknown }).experience = useExperience;
  void import('@react-three/fiber').then((m) => {
    (window as unknown as { __advance?: (t: number) => void }).__advance = (t) => m.advance(t, true);
  });
  void import('./scenes/Landing/loadSignal').then((m) => {
    (window as unknown as { __loadSignal?: unknown }).__loadSignal = m.loadSignal;
  });
  void import('./audio/AudioEngine').then((m) => {
    (window as unknown as { __audioTools?: unknown }).__audioTools = {
      computeBeatGrid: m.computeBeatGrid,
      pickLoopRegion: m.pickLoopRegion,
      estimateDownbeatPhase: m.estimateDownbeatPhase,
      bakeSeamlessLoop: m.bakeSeamlessLoop,
    };
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
