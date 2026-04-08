'use client';

import React, { useEffect, useRef } from 'react';

interface HexagonPatternProps {
  hexagons?: [number, number][];
  className?: string;
}

export const HexagonPattern = React.forwardRef<
  HTMLCanvasElement,
  HexagonPatternProps & React.HTMLAttributes<HTMLCanvasElement>
>(({ hexagons = [], className = '', ...props }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    // Hexagon settings
    const hexSize = 40;
    const gap = 10;

    // Draw hexagons
    hexagons.forEach(([col, row]) => {
      const x = col * (hexSize * 1.5 + gap) + hexSize + 50;
      const y = row * (hexSize * Math.sqrt(3) + gap) + hexSize + 50;

      drawHexagon(ctx, x, y, hexSize);
    });

    function drawHexagon(
      context: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      size: number
    ) {
      context.beginPath();

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const xOffset = Math.cos(angle) * size;
        const yOffset = Math.sin(angle) * size;

        if (i === 0) {
          context.moveTo(centerX + xOffset, centerY + yOffset);
        } else {
          context.lineTo(centerX + xOffset, centerY + yOffset);
        }
      }

      context.closePath();
      context.strokeStyle = 'rgba(168, 85, 247, 0.4)';
      context.lineWidth = 1;
      context.stroke();
    }
  }, [hexagons]);

  return (
    <canvas
      ref={(el) => {
        canvasRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      className={`w-full h-full ${className}`}
      {...props}
    />
  );
});

HexagonPattern.displayName = 'HexagonPattern';
