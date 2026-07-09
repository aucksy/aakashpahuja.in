// Streaming video preloader (§ user spec: the loading animation preloads the
// world video; the world begins only after it has FULLY loaded). Downloads with
// progress via fetch streaming and hands back a blob URL so playback starts
// instantly with zero network stall.

import { loadSignal } from '@/scenes/Landing/loadSignal';

export const WORLD_VIDEOS = {
  dark: '/assets/world-city.mp4',
  light: '/assets/world-beach.mp4',
} as const;

export function worldVideoUrl(theme: 'dark' | 'light'): string {
  return WORLD_VIDEOS[theme];
}

interface Entry {
  progress: number; // 0..1
  blobUrl: string | null;
  done: boolean;
}

const reg = new Map<string, Entry>();

export function startPreload(url: string): void {
  if (reg.has(url)) return;
  const e: Entry = { progress: 0, blobUrl: null, done: false };
  reg.set(url, e);
  void (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get('content-length') || 0);
      const reader = res.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value as Uint8Array<ArrayBuffer>);
        got += value.length;
        if (total > 0) e.progress = Math.min(0.995, got / total);
      }
      e.blobUrl = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: 'video/mp4' }));
      e.progress = 1;
      e.done = true;
    } catch (err) {
      // Never dead-lock the entry sequence on a network hiccup — proceed with
      // the plain URL and let the <video> element stream it.
      console.warn('[videoPreload] failed, falling back to direct src', url, err);
      e.progress = 1;
      e.done = true;
    }
  })();
}

const deferred = new Set<string>();

/** Start the download now — or, when `defer` is set (DESKTOP during the
 *  count-in), wait until the three bounces have landed first. § user: on a
 *  fast desktop connection the 13MB fetch churned the main thread during the
 *  gather, the per-frame gather spring lost wall-clock time, and the icons
 *  re-arranged late — missing beat 1. Deferring to `loadSignal.countInDone`
 *  (flips at beat 4, with its own in-loop fallbacks) clears the sync window;
 *  the 4.5s backstop here makes a deadlock impossible even if the flag never
 *  flips. Phones pass defer=false everywhere — byte-identical behaviour.
 *  (Also the avatar-era desktop loader rhythm: 00 through the bounces, then
 *  the counter tracks the download.) */
export function requestPreload(url: string, defer = false): void {
  if (reg.has(url) || deferred.has(url)) return;
  if (!defer || loadSignal.countInDone) {
    startPreload(url);
    return;
  }
  deferred.add(url);
  const t0 = performance.now();
  const id = window.setInterval(() => {
    if (loadSignal.countInDone || performance.now() - t0 > 4500) {
      window.clearInterval(id);
      deferred.delete(url);
      startPreload(url);
    }
  }, 100);
}

/** 0..1 download progress (1 if unknown/failed so the loader can't hang). */
export function preloadProgress(url: string): number {
  return reg.get(url)?.progress ?? 0;
}

/** Best playable source: blob when fully loaded, else the plain URL. */
export function preloadedSrc(url: string): string {
  return reg.get(url)?.blobUrl ?? url;
}
