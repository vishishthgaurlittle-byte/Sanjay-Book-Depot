import { useId } from 'react';

/**
 * Sanjay Book Depot — "Heritage Seal" logo (Logo 1).
 * Adapts to the active theme via the saffron CSS variables.
 */

const GOLD_TOP = 'var(--color-saffron-300, #E3BE76)';
const GOLD_BOT = 'var(--color-saffron-600, #A87C2A)';

/** Compact mark: ring + SBD monogram. For the header, favicon, small spaces. */
export function LogoMark({ size = 44, className = '' }: { size?: number; className?: string }) {
  const raw = useId();
  const id = `sbdm${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" className={className} role="img" aria-label="Sanjay Book Depot">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD_TOP} />
          <stop offset="1" stopColor={GOLD_BOT} />
        </linearGradient>
      </defs>
      <circle cx="75" cy="75" r="69" fill="none" stroke={`url(#${id})`} strokeWidth="4" />
      <circle cx="75" cy="75" r="58" fill="none" stroke={`url(#${id})`} strokeWidth="1.5" opacity="0.55" />
      <text x="75" y="90" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="44" fontWeight="700" letterSpacing="1" fill={`url(#${id})`}>
        SBD
      </text>
    </svg>
  );
}

/** Full crest: ring + "SANJAY BOOK DEPOT" arc + EST. 2026 + SBD. For the footer / large display. */
export function LogoSeal({ size = 130, className = '' }: { size?: number; className?: string }) {
  const raw = useId();
  const id = `sbds${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const arc = `sbda${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 150 150" className={className} role="img" aria-label="Sanjay Book Depot">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD_TOP} />
          <stop offset="1" stopColor={GOLD_BOT} />
        </linearGradient>
        <path id={arc} d="M75,75 m-53,0 a53,53 0 1,1 106,0" fill="none" />
      </defs>
      <circle cx="75" cy="75" r="70" fill="none" stroke={`url(#${id})`} strokeWidth="2.5" />
      <circle cx="75" cy="75" r="61" fill="none" stroke={`url(#${id})`} strokeWidth="1" opacity="0.55" />
      <text fontFamily="system-ui, -apple-system, sans-serif" fontSize="10.5" letterSpacing="3" fill={`url(#${id})`}>
        <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
          SANJAY BOOK DEPOT
        </textPath>
      </text>
      <text x="75" y="120" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" letterSpacing="2.5" fill={`url(#${id})`}>
        EST. 2026
      </text>
      <text x="75" y="86" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontSize="34" fontWeight="700" letterSpacing="1" fill={`url(#${id})`}>
        SBD
      </text>
    </svg>
  );
}
