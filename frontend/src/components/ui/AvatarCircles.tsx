'use client';

import React, { useState } from 'react';

interface AvatarInfo {
  imageUrl: string;
  profileUrl?: string;
  // Fallback text shown when the image fails to load (e.g. first letter of
  // the username). Renders as a gradient-backed circle with a single letter.
  initial?: string;
}

interface AvatarCirclesProps {
  numPeople?: number;
  avatarUrls?: AvatarInfo[];
}

// Deterministic gradient per initial so the fallback circles don't all look
// identical when several images are broken at once.
const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #14F195, #5b4dd1)',
  'linear-gradient(135deg, #06B6D4, #0e7490)',
  'linear-gradient(135deg, #EC4899, #be185d)',
  'linear-gradient(135deg, #f59e0b, #b45309)',
  'linear-gradient(135deg, #22c55e, #15803d)',
  'linear-gradient(135deg, #a855f7, #008F55)',
];

function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % FALLBACK_GRADIENTS.length;
  return FALLBACK_GRADIENTS[idx];
}

const AvatarCircles = ({ numPeople = 99, avatarUrls = [] }: AvatarCirclesProps) => {
  const [errored, setErrored] = useState<Record<number, boolean>>({});

  return (
    <div className="flex items-center">
      <div className="flex -space-x-4">
        {avatarUrls.map((avatar, i) => {
          const hasLink = avatar.profileUrl && avatar.profileUrl !== '#';
          const letter = (avatar.initial || 'U').trim().charAt(0).toUpperCase() || 'U';
          const isBroken = errored[i] || !avatar.imageUrl;
          const inner = isBroken ? (
            <div
              aria-label="User avatar"
              className="w-12 h-12 rounded-full border-2 border-[#0d0d0d] flex items-center justify-center text-sm font-medium text-white hover:scale-110 transition-transform duration-200"
              style={{ background: gradientFor(letter + String(i)) }}
            >
              {letter}
            </div>
          ) : (
            <img
              src={avatar.imageUrl}
              alt=""
              onError={() => setErrored((prev) => ({ ...prev, [i]: true }))}
              className="w-12 h-12 rounded-full border-2 border-[#0d0d0d] object-cover bg-zinc-800 hover:scale-110 transition-transform duration-200"
            />
          );
          return hasLink ? (
            <a
              key={i}
              href={avatar.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-block"
              style={{ zIndex: avatarUrls.length - i }}
            >
              {inner}
            </a>
          ) : (
            <span
              key={i}
              className="relative inline-block pointer-events-none"
              style={{ zIndex: avatarUrls.length - i }}
              aria-hidden="true"
            >
              {inner}
            </span>
          );
        })}
      </div>
      {numPeople > 0 && (
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#0d0d0d] text-xs font-medium text-white -ml-4"
          style={{
            background: 'linear-gradient(135deg, #00DC83, #00DC83)',
            zIndex: 0,
          }}
        >
          +{numPeople >= 1000 ? `${(numPeople / 1000).toFixed(0)}k` : numPeople}
        </div>
      )}
    </div>
  );
};

export { AvatarCircles };
export default AvatarCircles;
