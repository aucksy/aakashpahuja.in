import { useState } from 'react';

/** A reel cover in a compact 96×96 square tile that links out to the reel,
 *  brightening + glowing in the given chapter accent on hover/focus (§08 glass).
 *  Shared by the Guitar and Fitness chapters so the pattern stays identical —
 *  `accent` is a CSS colour (e.g. var(--magenta)) and `glowRgb` its "r,g,b"
 *  triplet used for the soft drop shadow. */
export function ReelTile({
  href,
  cover,
  index,
  total,
  subject,
  accent,
  glowRgb,
}: {
  href: string;
  cover: string;
  index: number;
  total: number;
  subject: string;
  accent: string;
  glowRgb: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Watch ${subject} reel ${index + 1} of ${total} on Instagram`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        position: 'relative',
        width: 96,
        height: 96,
        flex: 'none',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'block',
        textDecoration: 'none',
        background: '#0a0d16',
        border: `1px solid ${hover ? accent : 'var(--glass-border)'}`,
        boxShadow: hover
          ? `0 22px 50px -18px rgba(${glowRgb},0.7), inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 20px 50px -20px rgba(${glowRgb},0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
        transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <img
        src={cover}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: hover ? 'brightness(1.05)' : 'brightness(0.95)',
          transition: 'filter 0.4s ease',
        }}
      />
    </a>
  );
}
