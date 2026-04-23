'use client';

import { ExternalLink } from 'lucide-react';

import { FlaunchLogo } from './FlaunchLogo';

/**
 * Compact "Powered by Flaunch" badge meant to sit next to the
 * $BOLTY price pill in the top navbar. Hidden below md so the
 * mobile nav stays breathable.
 */
export function PoweredByFlaunchBadge({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <a
      href="https://flaunch.gg"
      target="_blank"
      rel="noopener noreferrer"
      title="Powered by Flaunch"
      className="group hidden items-center gap-1.5 rounded-lg transition-colors md:inline-flex"
      style={{
        padding: compact ? '5px 8px' : '6px 10px',
        background: 'rgba(201,255,65,0.06)',
        border: '1px solid rgba(201,255,65,0.18)',
        color: '#E6F7B4',
        fontSize: compact ? '10.5px' : '11px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(201,255,65,0.12)';
        e.currentTarget.style.borderColor = 'rgba(201,255,65,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(201,255,65,0.06)';
        e.currentTarget.style.borderColor = 'rgba(201,255,65,0.18)';
      }}
    >
      <FlaunchLogo size={14} />
      <span className="uppercase tracking-[0.14em] text-white/55">Powered by</span>
      <span className="font-semibold tracking-tight" style={{ color: '#C9FF41' }}>
        Flaunch
      </span>
      <ExternalLink className="h-3 w-3 opacity-40 transition group-hover:opacity-80" />
    </a>
  );
}

export default PoweredByFlaunchBadge;
