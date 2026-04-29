'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Share2 } from 'lucide-react';
import React, { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  label?: string;
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_CLASSNAME =
  'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-zinc-300 hover:text-white text-[12.5px] transition-all hover:brightness-110 tracking-[0.005em]';

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
    const shareText = text || `Check out "${title}" on Atlas`;
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

  const isDefaultClassName = className === DEFAULT_CLASSNAME;
  const style = isDefaultClassName
    ? copied
      ? {
          background: 'linear-gradient(180deg, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0.04) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(34,197,94,0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(34,197,94,0.4)',
          color: '#86efac',
        }
      : {
          background: 'linear-gradient(180deg, rgba(20,20,26,0.6) 0%, rgba(10,10,14,0.6) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
        }
    : undefined;

  return (
    <motion.button
      onClick={handleShare}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
      className={className}
      aria-label={ariaLabel || label}
      style={style}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 20 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            className="inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Copied</span>
          </motion.span>
        ) : (
          <motion.span
            key="share"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{label}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
