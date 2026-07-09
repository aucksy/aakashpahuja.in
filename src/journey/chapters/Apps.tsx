import { useEffect, useState, type CSSProperties } from 'react';
import Chapter from '../Chapter';
import { Reveal } from '../ui';
import { useIsMobile } from '@/lib/useIsMobile';

interface App {
  name: string;
  accent: string;
  tag: string;
  desc: string;
  icon: string;
  screens: string[];
}

const APPS: App[] = [
  {
    name: 'Spends',
    accent: 'var(--spends)',
    tag: "Know what's actually left.",
    desc: "Smart Cycle budgets by your salary and each card's own billing cycle — not the calendar month. It reads your bank SMS on-device with one-tap add, learning your categories and what to ignore, then puts recurring payments on autopilot, splits a single transaction across categories, adds home-screen widgets, and backs up encrypted to Drive. Private, offline-first, and fluent in ~25 Indian banks.",
    icon: '/assets/icon-spends-rounded.png',
    screens: ['/assets/spends-splash.jpg', '/assets/spends-home.png', '/assets/spends-analytics.png', '/assets/spends-recurring.png', '/assets/spends-settings.jpg'],
  },
  {
    name: 'Notification Digest',
    accent: 'var(--digest)',
    tag: 'A calmer phone, without missing what matters.',
    desc: "Intercepts the noise and delivers clean, scheduled digests — while OTPs, calls and messages stay real-time. The inbox works like email: search, filters, swipes, and deep links back to the exact thread. And a quiet counter tallies every interruption you never felt.",
    icon: '/assets/icon-digest.png',
    screens: ['/assets/nd-home.jpg', '/assets/nd-inbox.jpg'],
  },
  {
    name: 'ColorCloset',
    accent: 'var(--colorcloset)',
    tag: 'Outfits from the colours you already own.',
    desc: "A swipeable deck of colour pairings built only from your wardrobe — double-tap to save, mark what you've worn. It's tuned to your skin tone on the 10-point Monk scale and grounded in real colour science, and a gap engine names the one colour that unlocks the most new looks.",
    icon: '/assets/icon-colorcloset.png',
    screens: ['/assets/cc-home.jpg', '/assets/cc-skintone.jpg', '/assets/cc-buy.jpg'],
  },
  {
    name: 'Pause',
    accent: 'var(--pause)',
    tag: 'A minimal doom-scrolling interrupter.',
    desc: "It watches the foreground app, and after your chosen stretch of continuous scrolling a calm glassmorphic overlay appears. Not a blocker — it breaks the momentum and hands the choice back to you. No accounts, no analytics; nothing ever leaves the device.",
    icon: '/assets/icon-pause.png',
    screens: ['/assets/pause-home.jpg', '/assets/pause-style.jpg'],
  },
  {
    name: 'Forge AI',
    accent: 'var(--forgeai)',
    tag: 'Your gym. Your AI coach. Your lifetime progress.',
    desc: "One conversation drives everything — \"bench 80 for 8, 7, 6\" becomes structured training data. The Progressive-Overload Coach turns last session into today's target, and explains the why behind it. Bring a Claude or OpenAI key, or run fully offline with the built-in local coach.",
    icon: '/assets/icon-forgeai.png',
    screens: ['/assets/forgeai-home.jpg', '/assets/forgeai-chat.jpg', '/assets/forgeai-analytics.jpg'],
  },
];

function Phone({ screens, accent, flip, flat }: { screens: string[]; accent: string; flip: boolean; flat: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % screens.length), 2600);
    return () => window.clearInterval(id);
  }, [screens.length]);

  const frame: CSSProperties = {
    position: 'relative',
    // On phones it's centred below the copy — ~15% smaller than before and
    // tilted like the desktop devices (not flat), so it reads as a real 3-D phone.
    width: flat ? 'clamp(177px,49vw,221px)' : 'clamp(190px,22vw,244px)',
    aspectRatio: '9 / 19.3',
    // Generic, near-bezel-less device (hairline frame, no notch) — not an iPhone.
    borderRadius: 34,
    padding: 3,
    background: 'linear-gradient(160deg,#1a1f30,#0a0d16)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: `0 40px 90px -30px rgba(0,0,0,0.9), 0 0 60px -18px ${accent}, inset 0 1px 0 rgba(255,255,255,0.14)`,
    transform: `perspective(1400px) rotateY(${flip ? 15 : -15}deg) rotateX(5deg)`,
    flex: 'none',
  };
  return (
    <div style={frame}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 31, overflow: 'hidden', background: '#05060b' }}>
        {screens.map((s, idx) => (
          <img
            key={s}
            src={s}
            alt=""
            loading="lazy"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: idx === i ? 1 : 0,
              transform: idx === i ? 'scale(1)' : 'scale(1.04)',
              transition: 'opacity 0.9s ease, transform 3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Apps() {
  const isMobile = useIsMobile();
  return (
    <Chapter id="apps" label="My Apps">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(56px,9vh,110px)', marginTop: 0 }}>
        {APPS.map((app, idx) => {
          const flip = idx % 2 === 1;
          return (
            <Reveal key={app.name} y={40}>
              <div
                style={{
                  display: 'grid',
                  // Phone → single column on mobile: copy on top, phone centred
                  // below. The rtl flip (which alternates sides on desktop) is
                  // dropped so the text never gets squeezed into a ~140px column.
                  gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) auto',
                  gap: isMobile ? 28 : 'clamp(28px,5vw,64px)',
                  alignItems: 'center',
                  direction: isMobile ? 'ltr' : flip ? 'rtl' : 'ltr',
                }}
              >
                <div style={{ direction: 'ltr' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <img src={app.icon} alt="" width={52} height={52} style={{ borderRadius: 13, boxShadow: `0 8px 26px -8px ${app.accent}` }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(22px,3vw,30px)' }}>{app.name}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', color: app.accent, marginTop: 2 }}>{app.tag}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px,1.5vw,17px)', lineHeight: 1.62, color: 'var(--muted)', maxWidth: '48ch', margin: 0 }}>
                    {app.desc}
                  </p>
                </div>
                <div style={{ direction: 'ltr', display: 'flex', justifyContent: 'center' }}>
                  <Phone screens={app.screens} accent={app.accent} flip={flip} flat={isMobile} />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Chapter>
  );
}
