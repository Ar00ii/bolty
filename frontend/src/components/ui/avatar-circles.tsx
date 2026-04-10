'use client';

import React from 'react';

import { cn } from '@/lib/utils';

interface AvatarUrl {
  imageUrl: string;
  profileUrl?: string;
  userName?: string;
}

export function AvatarCircles({
  avatarUrls,
  numPeople = 0,
  className,
}: {
  avatarUrls: AvatarUrl[];
  numPeople?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex -space-x-2.5 rtl:space-x-reverse items-center', className)}>
      {avatarUrls.map((a, i) => {
        const altText = a.userName ? `${a.userName}'s avatar` : 'User avatar';
        return a.profileUrl ? (
          <a
            key={i}
            href={a.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-block"
            aria-label={`Visit ${a.userName ? a.userName + "'s" : ''} profile`}
          >
            <img
              src={a.imageUrl}
              alt={altText}
              className="w-8 h-8 rounded-full border-2 border-black object-cover"
            />
          </a>
        ) : (
          <div key={i} className="relative inline-block">
            <img
              src={a.imageUrl}
              alt={altText}
              className="w-8 h-8 rounded-full border-2 border-black object-cover"
            />
          </div>
        );
      })}
      {numPeople > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-black bg-zinc-900 flex items-center justify-center">
          <span className="text-[9px] font-mono font-light text-zinc-400">+{numPeople}</span>
        </div>
      )}
    </div>
  );
}
