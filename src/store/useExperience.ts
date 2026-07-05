import { create } from 'zustand';
import type { Quality } from '@/lib/env';
import { detectWebGL, prefersReducedMotion, prefersLight, guessQuality } from '@/lib/env';

export type Theme = 'dark' | 'light';

/**
 * The entry sequence (§12 SC-01→SC-02, §21 "the burst IS the loader"):
 *   overture — frosted glass + hidden objects + Enter button
 *   loading  — objects dance to the beat while a 0→100 loader fills
 *   burst    — the loader hits 100; objects punch out, colour ignites
 *   world    — inside; the hero payoff (city journey = later milestones)
 */
export type Phase = 'overture' | 'loading' | 'burst' | 'world';

const LS_KEY = 'aakash.experience.v1';

interface Persisted {
  theme: Theme;
  volume: number;
  visited: boolean;
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { theme: 'dark', volume: 0.55, visited: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  // First visit: honour prefers-color-scheme for the initial world (§03).
  return { theme: prefersLight() ? 'light' : 'dark', volume: 0.55, visited: false };
}

function save(p: Persisted) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

interface ExperienceState {
  // ---- The two dials + entry ----
  theme: Theme; // which world
  volume: number; // energy/intensity dial, 0..1 (0 ≈ calm/Work feel)
  phase: Phase; // where in the entry sequence
  audioStarted: boolean;
  muted: boolean;

  // ---- Derived global mode target (0 = Work .. 1 = Play). Spring lives in R3F. ----
  modeTarget: number;

  // ---- Journey (§13: scroll = distance travelled) ----
  scroll: number; // 0..1 master playhead down the journey
  activeChapter: string; // id of the chapter currently in view

  // ---- Capability / environment ----
  reducedMotion: boolean;
  hasWebGL: boolean;
  quality: Quality;
  firstVisit: boolean;

  // ---- Actions ----
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setVolume: (v: number) => void;
  enter: () => void;
  setPhase: (p: Phase) => void;
  setAudioStarted: (b: boolean) => void;
  toggleMute: () => void;
  setScroll: (n: number) => void;
  setActiveChapter: (id: string) => void;
  probeCapabilities: () => void;
}

const initial = loadPersisted();

export const useExperience = create<ExperienceState>((set, get) => ({
  theme: initial.theme,
  volume: initial.volume,
  phase: 'overture',
  audioStarted: false,
  muted: false,
  modeTarget: 0,
  scroll: 0,
  activeChapter: 'hero',

  reducedMotion: false,
  hasWebGL: true,
  quality: 'high',
  firstVisit: !initial.visited,

  setTheme: (t) => {
    set({ theme: t });
    save({ theme: t, volume: get().volume, visited: true });
    document.documentElement.dataset.theme = t;
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(1, v));
    set({ volume });
    save({ theme: get().theme, volume, visited: true });
  },

  enter: () => {
    if (get().phase !== 'overture') return;
    // Volume up ⇒ lean into Play; at zero ⇒ stay Work-calm (§03).
    set({ phase: 'loading', firstVisit: false, modeTarget: get().volume > 0.02 ? 1 : 0 });
    save({ theme: get().theme, volume: get().volume, visited: true });
  },

  setPhase: (p) => set({ phase: p }),

  setAudioStarted: (b) => set({ audioStarted: b }),
  toggleMute: () => set({ muted: !get().muted }),

  setScroll: (n) => set({ scroll: Math.max(0, Math.min(1, n)) }),
  setActiveChapter: (id) => {
    if (get().activeChapter !== id) set({ activeChapter: id });
  },

  probeCapabilities: () =>
    set({
      reducedMotion: prefersReducedMotion(),
      hasWebGL: detectWebGL(),
      quality: guessQuality(),
    }),
}));
