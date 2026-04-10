'use client';

import { useState, useEffect } from 'react';

export function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let throttleTimer: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      clearTimeout(throttleTimer);
      throttleTimer = setTimeout(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }, 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(throttleTimer);
    };
  }, []);

  return mousePosition;
}
