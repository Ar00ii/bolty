'use client';

import React from 'react';
import { useEffect, useRef } from 'react';

const CHARS = '01001101 01011010 00110101 10110100 11010011 ABCDEF0123456789';
const FONT_SIZE = 13;
const PURPLE = '#836EF9';
const GREEN = '#28c840';
const DIM_PURPLE = 'rgba(131,110,249,0.4)';
const DIM_GREEN = 'rgba(40,200,64,0.3)';

export function MatrixRain({ opacity = 0.12 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<number[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / FONT_SIZE) + 1;
      dropsRef.current = Array.from({ length: cols }, () =>
        Math.floor((Math.random() * -canvas.height) / FONT_SIZE),
      );
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      // Fade trail
      ctx.fillStyle = 'rgba(9, 9, 11, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${FONT_SIZE}px "JetBrains Mono", monospace`;

      dropsRef.current.forEach((y, i) => {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * FONT_SIZE;
        const screenY = y * FONT_SIZE;

        if (screenY < 0) {
          dropsRef.current[i]++;
          return;
        }

        // Bright leading char
        ctx.fillStyle = Math.random() > 0.5 ? PURPLE : GREEN;
        ctx.fillText(char, x, screenY);

        // Dim trail for char just above
        const prevChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        ctx.fillStyle = Math.random() > 0.5 ? DIM_PURPLE : DIM_GREEN;
        ctx.fillText(prevChar, x, screenY - FONT_SIZE);

        // Reset drop randomly after it exits screen
        if (screenY > canvas.height && Math.random() > 0.97) {
          dropsRef.current[i] = Math.floor(Math.random() * -20);
        }

        dropsRef.current[i]++;
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity, transition: 'opacity 0.6s ease' }}
      aria-hidden="true"
    />
  );
}
