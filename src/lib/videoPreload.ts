// Streaming video preloader (§ user spec: the loading animation preloads the
// world video; the world begins only after it has FULLY loaded). Downloads with
// progress via fetch streaming and hands back a blob URL so playback starts
// instantly with zero network stall.

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

/** 0..1 download progress (1 if unknown/failed so the loader can't hang). */
export function preloadProgress(url: string): number {
  return reg.get(url)?.progress ?? 0;
}

/** Best playable source: blob when fully loaded, else the plain URL. */
export function preloadedSrc(url: string): string {
  return reg.get(url)?.blobUrl ?? url;
}
