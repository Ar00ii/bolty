'use client';

import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  characters?: string;
  className?: string;
  encryptedClassName?: string;
  animateOn?: 'hover' | 'view' | 'click';
  onAnimationComplete?: () => void;
}

const DEFAULT_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = true,
  revealDirection = 'start',
  characters = DEFAULT_CHARS,
  className = '',
  encryptedClassName = '',
  animateOn = 'view',
  onAnimationComplete,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState<string[]>(text.split(''));
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  const getRevealOrder = useCallback((): number[] => {
    const indices = text
      .split('')
      .map((_, i) => i)
      .filter((i) => text[i] !== ' ');
    if (revealDirection === 'end') return [...indices].reverse();
    if (revealDirection === 'center') {
      const mid = Math.floor(indices.length / 2);
      const result: number[] = [];
      for (let i = 0; i <= mid; i++) {
        if (mid - i >= 0 && indices[mid - i] !== undefined) result.push(indices[mid - i]);
        if (mid + i + 1 < indices.length && indices[mid + i + 1] !== undefined)
          result.push(indices[mid + i + 1]);
      }
      return result;
    }
    return indices; // 'start' — left to right
  }, [text, revealDirection]);

  const randomChar = useCallback(() => {
    return characters[Math.floor(Math.random() * characters.length)];
  }, [characters]);

  const startAnimation = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);

    const order = getRevealOrder();
    let step = 0;
    const revealed = new Set<number>();

    // add spaces as already revealed
    text.split('').forEach((ch, i) => {
      if (ch === ' ') revealed.add(i);
    });

    intervalRef.current = setInterval(() => {
      // scramble unrevealed
      setDisplayText((prev) =>
        prev.map((ch, i) => {
          if (revealed.has(i) || text[i] === ' ') return text[i];
          return randomChar();
        }),
      );

      if (sequential) {
        if (step < order.length) {
          revealed.add(order[step]);
          step++;
          setRevealedIndices(new Set(revealed));
        } else {
          // fully revealed
          setDisplayText(text.split(''));
          setRevealedIndices(new Set(text.split('').map((_, i) => i)));
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnimating(false);
          onAnimationComplete?.();
        }
      } else {
        // non-sequential: random reveals
        const unrevealedCount = order.length - step;
        if (unrevealedCount > 0) {
          const idx = order[Math.floor(Math.random() * order.length)];
          if (!revealed.has(idx)) {
            revealed.add(idx);
            step++;
            setRevealedIndices(new Set(revealed));
          }
        } else {
          setDisplayText(text.split(''));
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsAnimating(false);
          onAnimationComplete?.();
        }
      }
    }, speed);
  }, [isAnimating, getRevealOrder, text, sequential, speed, randomChar, onAnimationComplete]);

  const resetAnimation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsAnimating(false);
    setRevealedIndices(new Set());
    setDisplayText(text.split('').map((ch) => (ch === ' ' ? ' ' : randomChar())));
  }, [text, randomChar]);

  // view trigger
  useEffect(() => {
    if (animateOn !== 'view') return;
    if (!containerRef.current) return;
    const el = containerRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          startAnimation();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animateOn, startAnimation]);

  // init scramble for non-view modes
  useEffect(() => {
    if (animateOn === 'view') {
      setDisplayText(text.split('').map((ch) => (ch === ' ' ? ' ' : randomChar())));
    }
  }, [animateOn, text, randomChar]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') startAnimation();
  };
  const handleMouseLeave = () => {
    if (animateOn === 'hover') resetAnimation();
  };
  const handleClick = () => {
    if (animateOn === 'click') startAnimation();
  };

  return (
    <span
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      aria-label={text}
      style={{ display: 'inline' }}
    >
      <span aria-hidden="true">
        {displayText.map((ch, i) => (
          <span
            key={i}
            className={revealedIndices.has(i) || text[i] === ' ' ? className : encryptedClassName}
          >
            {ch}
          </span>
        ))}
      </span>
    </span>
  );
}
