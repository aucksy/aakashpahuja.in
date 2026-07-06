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
    tag: 'Remaining-salary tracker for credit-card users',
    desc: "A remaining-salary tracker built for credit-card users. It reads spends straight from your bank SMS, adds recurring payments on autopilot, splits a single transaction across categories, and backs up to Google Drive — so what's actually left is always one glance away.",
    icon: '/assets/icon-spends.png',
    screens: ['/assets/spends-splash.jpg', '/assets/spends-home.jpg', '/assets/spends-analytics.jpg', '/assets/spends-recurring.jpg'],
  },
  {
    name: 'Notification Digest',
    accent: 'var(--digest)',
    tag: 'Your notifications, on your schedule',
    desc: 'Intercepts notifications, stores them privately on-device, and delivers clean digests at the times you choose — while keeping the things that matter (messages, OTPs, calls, alarms) real-time.',
    icon: '/assets/icon-digest.png',
    screens: ['/assets/nd-home.jpg', '/assets/nd-inbox.jpg'],
  },
  {
    name: 'ColorCloset',
    accent: 'var(--colorcloset)',
    tag: 'Your wardrobe, colour-matched',
    desc: 'Turns your wardrobe colours into a swipeable deck of outfit pairings — tuned to your skin tone and grounded in colour science.',
    icon: '/assets/icon-colorcloset.png',
    screens: ['/assets/cc-home.jpg', '/assets/cc-skintone.jpg', '/assets/cc-buy.jpg'],
  },
  {
    name: 'Pause',
    accent: 'var(--pause)',
    tag: 'Break the doom-scroll',
    desc: 'A minimal doom-scroll interrupter: after continuous time in a chosen app, a brief full-screen glassmorphic overlay breaks the momentum. No accounts, no analytics — nothing leaves the device.',
    icon: '/assets/icon-pause.png',
    screens: ['/assets/pause-home.jpg', '/assets/pause-style.jpg'],
  },
  {
    name: 'Forge AI',
    accent: 'var(--forgeai)',
    tag: 'Chat-based AI coach for progressive overload',
    desc: 'A workout and calorie tracker you talk to. Ask in plain language and it programs the next session to keep your lifts climbing — targets, deloads, even calories from a meal photo — all aimed at your weight goal. Answers from a built-in local coach, or bring a Claude / OpenAI key for full conversational AI.',
    icon: '/assets/icon-forgeai.png',
    screens: ['/assets/forgeai-home.jpg', '/assets/forgeai-chat.jpg', '/assets/forgeai-analytics.jpg'],
  },
  {
    name: 'BragBuddy',
    accent: 'var(--bragbuddy)',
    tag: 'AI journal for work wins',
    desc: 'Speak or type a few seconds a day and BragBuddy keeps an always-ready record of your wins, organised around your own appraisal framework — the pillars your company reviews you on. At review time, AI curates a polished, manager-ready summary: the strongest wins per pillar, ready to paste into the form.',
    icon: '/assets/icon-bragbuddy.png',
    screens: ['/assets/bragbuddy-home.jpg', '/assets/bragbuddy-framework.jpg', '/assets/bragbuddy-summary.jpg'],
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
