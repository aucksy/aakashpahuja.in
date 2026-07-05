// The journey's chapters (§12 storyboard SC-03 → SC-09), in scroll order. Each
// keeps its own accent hue; app chapters use the app's brand colour (§06).

export interface ChapterMeta {
  id: string;
  n: string; // rail number
  label: string;
  accent: string; // CSS colour
}

export const CHAPTERS: ChapterMeta[] = [
  { id: 'hero', n: '01', label: 'Hero', accent: 'var(--cyan)' },
  { id: 'apps', n: '02', label: 'My Apps', accent: 'var(--emerald)' },
  { id: 'fitness', n: '03', label: 'Fitness', accent: 'var(--coral)' },
  { id: 'guitar', n: '04', label: 'Guitar & Singing', accent: 'var(--magenta)' },
  { id: 'gaming', n: '05', label: 'Gaming', accent: 'var(--violet)' },
  { id: 'github', n: '06', label: 'GitHub', accent: 'var(--cyan)' },
  { id: 'contact', n: '07', label: 'Contact', accent: 'var(--gold)' },
];
