// A beautiful static fallback for no-WebGL / context-loss (§22) — never a blank
// canvas. Pure CSS: the void gradient, a frosted glass card, the hero line and
// the shipped-app list. On-brand, fully readable, no 3D required.

import type { CSSProperties } from 'react';

const card: CSSProperties = {
  position: 'relative',
  maxWidth: 720,
  margin: '0 24px',
  padding: 'clamp(28px,5vw,48px)',
  background: 'var(--glass-fill)',
  border: '1px solid var(--glass-border)',
  borderRadius: 24,
  backdropFilter: 'blur(22px)',
  WebkitBackdropFilter: 'blur(22px)',
  boxShadow: '0 30px 80px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
};

export default function NoWebGLFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(1200px 820px at 12% -8%, rgba(96,80,210,0.30), transparent 60%), radial-gradient(1000px 720px at 104% 6%, rgba(38,132,168,0.22), transparent 55%), radial-gradient(1000px 1000px at 50% 128%, rgba(190,60,160,0.16), transparent 60%), linear-gradient(#05060b,#04050a)',
      }}
    >
      <div style={card}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--cyan)' }}>
          Aakash Pahuja · Digital Product Manager / Designer
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(32px,6vw,58px)', lineHeight: 1.02, letterSpacing: '-0.02em', margin: '18px 0 0' }}>
          Shipping experiences people love takes{' '}
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--cyan)' }}>obsession.</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.6, color: 'var(--muted)', maxWidth: '60ch', marginTop: 20 }}>
          This portfolio is normally an interactive WebGL experience. Your browser doesn't have
          WebGL available, so here's the short version.
        </p>
        <ul style={{ fontFamily: 'var(--font-body)', fontSize: 15.5, lineHeight: 1.7, color: 'var(--muted)', paddingLeft: 18, marginTop: 8 }}>
          <li><strong style={{ color: 'var(--ink)' }}>Spends</strong> — offline-first, privacy-first expense tracker.</li>
          <li><strong style={{ color: 'var(--ink)' }}>Notification Digest</strong> — private, on-device notification digests.</li>
          <li><strong style={{ color: 'var(--ink)' }}>ColorCloset</strong> — wardrobe colour pairings, tuned to skin tone.</li>
          <li><strong style={{ color: 'var(--ink)' }}>Pause</strong> — a minimal doom-scroll interrupter.</li>
        </ul>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em' }}>
          <a href="https://github.com/aucksy" style={{ color: 'var(--cyan)' }}>GitHub</a>
          <a href="https://instagram.com/aakashpahuja108" style={{ color: 'var(--cyan)' }}>Instagram</a>
          <a href="https://hevy.com/user/aucksy" style={{ color: 'var(--cyan)' }}>Hevy</a>
        </div>
      </div>
    </div>
  );
}
