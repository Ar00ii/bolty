'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface HexagonPatternProps {
  className?: string;
}

export const HexagonPattern = React.forwardRef<
  HTMLCanvasElement,
  HexagonPatternProps & React.HTMLAttributes<HTMLCanvasElement>
>(({ className = '', ...props }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    ctx.clearRect(0, 0, width, height);

    // Hexagon settings - proper proportions
    const hexRadius = 50;
    const gap = 8;

    // Proper hexagon spacing for honeycomb pattern
    const hexWidth = hexRadius * 2;
    const hexHeight = hexRadius * Math.sqrt(3);

    // Draw hexagons in a grid pattern
    const verticalSpacing = hexHeight * (Math.sqrt(3) / 2);
    for (let col = -2; col < Math.ceil(width / (hexWidth * 0.75)) + 2; col++) {
      for (let row = -2; row < Math.ceil(height / verticalSpacing) + 2; row++) {
        // Honeycomb offset pattern
        const xOffset = row % 2 === 0 ? 0 : hexWidth * 0.75;
        const x = col * (hexWidth * 0.75) + xOffset + 50;
        const y = row * verticalSpacing + 50;

        drawHexagon(ctx, x, y, hexRadius);
      }
    }

    // Apply diagonal fade gradient from top-left to bottom-right
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent at top-left
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)'); // Middle
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Opaque at bottom-right

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    function drawHexagon(context: CanvasRenderingContext2D, x: number, y: number, size: number) {
      context.beginPath();

      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const xOffset = Math.cos(angle) * size;
        const yOffset = Math.sin(angle) * size;

        if (i === 0) {
          context.moveTo(x + xOffset, y + yOffset);
        } else {
          context.lineTo(x + xOffset, y + yOffset);
        }
      }

      context.closePath();
      context.strokeStyle = 'rgba(200, 200, 210, 0.2)';
      context.lineWidth = 1;
      context.stroke();
    }
  }, []);

  const handleRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      canvasRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  return <canvas ref={handleRef} className={`w-full h-full ${className}`} {...props} />;
});

HexagonPattern.displayName = 'HexagonPattern';
