'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'purple' | 'white' | 'gray';
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const colorClasses = {
  purple: 'text-[#b4a7ff]',
  white: 'text-white',
  gray: 'text-zinc-400',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'purple',
  fullPage = false,
}) => {
  const spinner = (
    <div className={`relative ${sizeClasses[size]}`}>
      <div
        className={`absolute inset-0 rounded-full border-2 border-white/5 ${colorClasses[color]}`}
      />
      <div
        className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${colorClasses[color]}`}
        style={{
          borderTopColor: 'currentColor',
          borderRightColor: 'currentColor',
          filter: color === 'purple' ? 'drop-shadow(0 0 6px rgba(131,110,249,0.55))' : undefined,
        }}
      />
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-[13px] text-zinc-400 tracking-[0.005em]">Loading</p>
        </div>
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.displayName = 'LoadingSpinner';
