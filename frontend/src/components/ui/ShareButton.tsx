'use client';

import { Share2 } from 'lucide-react';
import React, { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  label?: string;
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_CLASSNAME =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white text-sm transition-colors';

export function ShareButton({
  title,
  text,
  label = 'Share',
  className = DEFAULT_CLASSNAME,
  ariaLabel,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const shareText = text || `Check out "${title}" on Bolty`;
    const nav = window.navigator as Navigator & {
      share?: (d: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title, text: shareText, url });
        return;
      } catch {
        /* user cancelled or share unavailable — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button onClick={handleShare} className={className} aria-label={ariaLabel || label}>
      <Share2 className="w-4 h-4" />
      {copied ? 'Copied!' : label}
    </button>
  );
}
