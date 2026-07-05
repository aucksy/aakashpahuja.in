import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Chapter from '../Chapter';
import { Reveal } from '../ui';

const EASE = [0.2, 0.7, 0.2, 1] as const;
const VIDEO_SRC = '/assets/aakash-hero.mp4';
const LOOP_AT = 3; // the 3-second self — trim playback to a tight 3s loop

function Words({ text, style }: { text: string; style: React.CSSProperties }) {
  const words = text.split(' ');
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      style={style}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 26, filter: 'blur(10px)' },
            show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
          }}
          style={{ display: 'inline-block', marginRight: '0.26em' }}
        >
          {w}
        </motion.span>
      ))}
    </motion.div>
  );
}

/** The 3-second self — a glass monolith playing the Soul-rendered video.
 *  Muted, looping at 3s, tilted into the street's perspective. Falls back to a
 *  monogram card if the video asset is missing. */
function SoulMonolith() {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateY: -14 }}
      whileInView={{ opacity: 1, y: 0, rotateY: -8 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.35 }}
      style={{
        position: 'relative',
        width: 'clamp(220px,26vw,300px)',
        aspectRatio: '9 / 16',
        borderRadius: 28,
        padding: 8,
        transformPerspective: 1200,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03))',
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow:
          '0 60px 120px -40px rgba(0,0,0,0.9), 0 0 80px -20px rgba(93,229,224,0.35), 0 0 120px -30px rgba(255,93,177,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        justifySelf: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 21, overflow: 'hidden', background: '#0a0d18' }}>
        {!failed ? (
          <video
            ref={ref}
            src={VIDEO_SRC}
            poster="/assets/aakash-hero-poster.png"
            muted
            autoPlay
            loop
            playsInline
            onError={() => setFailed(true)}
            onTimeUpdate={() => {
              const v = ref.current;
              if (v && v.currentTime >= LOOP_AT) v.currentTime = 0;
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              background: 'radial-gradient(120% 100% at 30% 20%, rgba(139,123,247,0.35), transparent 60%), linear-gradient(160deg,#131a33,#05060b)',
            }}
          >
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 64, letterSpacing: '-0.02em', background: 'linear-gradient(120deg,var(--cyan),var(--magenta))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
              AP
            </div>
          </div>
        )}
        {/* film-title lower third */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '38px 16px 14px', background: 'linear-gradient(transparent, rgba(4,5,10,0.85))' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 19, letterSpacing: '0.01em', color: '#fff' }}>Aakash Pahuja</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--cyan)', marginTop: 3 }}>
            The 3-second self · Soul render
          </div>
        </div>
      </div>
      {/* rec chip */}
      <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
        <motion.span animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4d5e', boxShadow: '0 0 10px #ff4d5e' }} />
        3.0s
      </div>
    </motion.div>
  );
}

/** SC-03 — the arrival. Award typography over the street; the 3-second self
 *  floating beside it in glass. */
export default function Hero() {
  return (
    <Chapter id="hero" label="Hero">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 'clamp(36px,5vw,64px)',
          alignItems: 'center',
        }}
      >
        <div>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 11.5, letterSpacing: '0.26em', textTransform: 'uppercase', color: 'var(--cyan)', marginBottom: 26 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--cyan)', boxShadow: '0 0 12px var(--cyan)' }} />
              Aakash Pahuja — Digital Product Manager / Designer
            </div>
          </Reveal>
          <Words
            text="Vibe-coding is easy."
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(42px,7.6vw,96px)', lineHeight: 0.96, letterSpacing: '-0.035em' }}
          />
          <Words
            text="Shipping experiences people love takes obsession."
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 'clamp(30px,5.4vw,66px)',
              lineHeight: 1.04,
              letterSpacing: '-0.01em',
              marginTop: 14,
              maxWidth: '18ch',
              background: 'linear-gradient(100deg,var(--cyan),var(--violet) 55%,var(--magenta))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(139,123,247,0.28))',
            }}
          />
          <Reveal delay={0.7}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(15px,1.7vw,19px)', lineHeight: 1.62, color: 'var(--muted)', maxWidth: '46ch', margin: '30px 0 0' }}>
              I turn ambiguous programmes into shipped products — then go build things for the sheer joy of it. This street is the tour.
            </p>
          </Reveal>
          <Reveal delay={0.85}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 44, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
                Drive down the street
              </motion.span>
              <span style={{ fontSize: 16 }}>↓</span>
            </div>
          </Reveal>
        </div>

        <SoulMonolith />
      </div>
    </Chapter>
  );
}
