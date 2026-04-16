'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface AvatarInfo {
  imageUrl: string;
  profileUrl: string;
}

interface AvatarCirclesProps {
  numPeople?: number;
  avatarUrls?: AvatarInfo[];
}

const AvatarCircles = ({
  numPeople = 99,
  avatarUrls = [],
}: AvatarCirclesProps) => {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-4">
        {avatarUrls.map((avatar, i) => (
          <a
            key={i}
            href={avatar.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-block"
            style={{ zIndex: avatarUrls.length - i }}
          >
            <img
              src={avatar.imageUrl}
              alt="User avatar"
              className="w-12 h-12 rounded-full border-2 border-[#0d0d0d] object-cover hover:scale-110 transition-transform duration-200"
            />
          </a>
        ))}
      </div>
      {numPeople > 0 && (
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#0d0d0d] text-xs font-medium text-white -ml-4"
          style={{
            background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
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
