'use client';

import React from 'react';
import { useEffect, useRef } from 'react';

export function GradientMeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    let animationFrameId: number;
    let time = 0;

    const colors = [
      { r: 131, g: 110, b: 249 }, // Atlas purple
      { r: 6, g: 182, b: 212 }, // Cyan
      { r: 236, g: 72, b: 153 }, // Magenta
    ];

    const animate = () => {
      time += 0.002;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Create gradient mesh effect
      const gradient = ctx.createLinearGradient(0, 0, width, height);

      const t = (Math.sin(time) + 1) / 2;
      const nextColor = (colorIndex: number) => {
        const current = colors[colorIndex];
        const next = colors[(colorIndex + 1) % colors.length];
        return {
          r: Math.round(current.r + (next.r - current.r) * t),
          g: Math.round(current.g + (next.g - current.g) * t),
          b: Math.round(current.b + (next.b - current.b) * t),
        };
      };

      const c1 = nextColor(0);
      const c2 = nextColor(1);
      const c3 = nextColor(2);

      gradient.addColorStop(0, `rgb(${c1.r}, ${c1.g}, ${c1.b})`);
      gradient.addColorStop(0.5, `rgb(${c2.r}, ${c2.g}, ${c2.b})`);
      gradient.addColorStop(1, `rgb(${c3.r}, ${c3.g}, ${c3.b})`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add noise/mesh texture
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 10;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }

      ctx.putImageData(imageData, 0, 0);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-60"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
