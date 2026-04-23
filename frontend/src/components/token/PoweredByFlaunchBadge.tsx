'use client';

import { ExternalLink } from 'lucide-react';

import { FlaunchLogo } from './FlaunchLogo';

/**
 * "Powered by Flaunch" attribution badge. Styled to match the
 * Flaunch brand (coral → magenta, sampled from the official PNG) —
 * no green accents, no cramped padding, logo sized so it actually
 * reads at a glance.
 */
export function PoweredByFlaunchBadge({
  logoSize = 26,
}: {
  logoSize?: number;
}) {
  return (
    <a
      href="https://flaunch.gg"
      target="_blank"
      rel="noopener noreferrer"
      title="Powered by Flaunch"
      className="group inline-flex items-center gap-2.5 rounded-xl px-4 py-2 transition"
      style={{
        background:
          'linear-gradient(135deg, rgba(208,112,96,0.14) 0%, rgba(160,80,144,0.12) 60%, rgba(96,80,208,0.12) 100%)',
        border: '1px solid rgba(208,112,96,0.25)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 18px -12px rgba(208,112,96,0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(208,112,96,0.45)';
        e.currentTarget.style.filter = 'brightness(1.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(208,112,96,0.25)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      <FlaunchLogo size={logoSize} />
      <div className="flex flex-col leading-tight">
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-white/55">
          Powered by
        </span>
        <span
          className="text-sm font-semibold tracking-tight"
          style={{ color: '#F7A896' }}
        >
          Flaunch
        </span>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-white/30 transition group-hover:text-white/70" />
    </a>
  );
}

export default PoweredByFlaunchBadge;
