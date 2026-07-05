import { useEffect } from 'react';
import { useExperience } from '@/store/useExperience';
import Landing from '@/scenes/Landing/Landing';

export default function App() {
  const probeCapabilities = useExperience((s) => s.probeCapabilities);
  const theme = useExperience((s) => s.theme);

  // Detect WebGL / reduced-motion / quality tier once, before first paint of 3D.
  useEffect(() => {
    probeCapabilities();
  }, [probeCapabilities]);

  // Reflect the current world on <html data-theme> for native-control theming.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return <Landing />;
}
