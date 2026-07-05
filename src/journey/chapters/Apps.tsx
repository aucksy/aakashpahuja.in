import { useEffect, useState, type CSSProperties } from 'react';
import Chapter from '../Chapter';
import { Kicker, Reveal, h2Style, leadStyle } from '../ui';

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
    tag: 'Offline-first, privacy-first expense tracker',
    desc: 'Kotlin / Compose, Material 3. Money stored as integer paise, entirely on-device — nothing leaves the phone. The signature feature: near-frictionless capture straight from bank SMS and UPI notifications.',
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

function Phone({ screens, accent, flip }: { screens: string[]; accent: string; flip: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((v) => (v + 1) % screens.length), 2600);
    return () => window.clearInterval(id);
  }, [screens.length]);

  const frame: CSSProperties = {
    position: 'relative',
    width: 'clamp(190px,22vw,244px)',
    aspectRatio: '9 / 19.3',
    borderRadius: 36,
    padding: 9,
    background: 'linear-gradient(160deg,#1a1f30,#0a0d16)',
    border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: `0 40px 90px -30px rgba(0,0,0,0.9), 0 0 60px -18px ${accent}, inset 0 1px 0 rgba(255,255,255,0.14)`,
    transform: `perspective(1400px) rotateY(${flip ? 11 : -11}deg) rotateX(4deg)`,
    flex: 'none',
  };
  return (
    <div style={frame}>
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 28, overflow: 'hidden', background: '#05060b' }}>
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
        {/* notch */}
        <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 74, height: 20, borderRadius: 12, background: 'rgba(5,6,11,0.9)' }} />
      </div>
    </div>
  );
}

export default function Apps() {
  return (
    <Chapter id="apps" label="My Apps">
      <Kicker n="02" accent="var(--emerald)">
        My Apps
      </Kicker>
      <Reveal>
        <h2 style={{ ...h2Style, maxWidth: '18ch' }}>Six apps that leap into your hands.</h2>
      </Reveal>
      <Reveal delay={0.05}>
        <p style={{ ...leadStyle, marginBottom: 20 }}>
          Android, privacy-first — each with its own accent hue. Four run entirely on-device; the two AI apps put you in control, bring-your-own-key.
        </p>
      </Reveal>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(56px,9vh,110px)', marginTop: 40 }}>
        {APPS.map((app, idx) => {
          const flip = idx % 2 === 1;
          return (
            <Reveal key={app.name} y={40}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  gap: 'clamp(28px,5vw,64px)',
                  alignItems: 'center',
                  direction: flip ? 'rtl' : 'ltr',
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
                  <Phone screens={app.screens} accent={app.accent} flip={flip} />
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Chapter>
  );
}
