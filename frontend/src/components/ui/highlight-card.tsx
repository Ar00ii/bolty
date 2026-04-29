'use client';

import Link from 'next/link';
import React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HighlightCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href?: string;
  accentColor?: string;
  className?: string;
}

export function HighlightCard({
  icon: Icon,
  title,
  description,
  href,
  accentColor = 'var(--brand, #14F195)',
  className,
}: HighlightCardProps) {
  const cardContent = (
    <Card
      className={cn(
        'group relative overflow-hidden border transition-all duration-200 ease-out',
        'border-white/10 bg-black/20 backdrop-blur-md text-[var(--text)] shadow-none',
        'hover:-translate-y-[3px] hover:shadow-lg hover:border-white/20',
        className,
      )}
      style={
        {
          '--_accent': accentColor,
        } as React.CSSProperties
      }
    >
      {/* Gradient top border — visible on hover */}
      <div
        className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        }}
      />

      {/* Hover glow on the card border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-250 ease-out group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 30%, transparent), 0 0 20px -8px ${accentColor}`,
        }}
      />

      {/* Shimmer overlay — single sweep on hover */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -translate-x-full',
          'transition-transform duration-700 ease-out',
          'group-hover:translate-x-full',
        )}
        style={{
          background: `linear-gradient(
            120deg,
            transparent 30%,
            color-mix(in srgb, ${accentColor} 8%, transparent) 45%,
            color-mix(in srgb, ${accentColor} 12%, transparent) 50%,
            color-mix(in srgb, ${accentColor} 8%, transparent) 55%,
            transparent 70%
          )`,
        }}
      />

      <CardContent className="relative z-10 flex items-start gap-4 p-6">
        {/* Icon container */}
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            'transition-colors duration-200 ease-out',
          )}
          style={{
            backgroundColor: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
            color: accentColor,
          }}
        >
          <Icon
            className="h-5 w-5 transition-[filter] duration-200 ease-out group-hover:brightness-125"
            strokeWidth={1.75}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-light leading-tight text-[var(--text)]">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
