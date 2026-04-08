import React, { useRef, useState } from 'react';
import './Spotlight.css';

interface SpotlightProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export const Spotlight = ({
  children,
  className = '',
  spotlightColor = 'rgba(168, 85, 247, 0.3)',
}: SpotlightProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className={`spotlight-container ${className}`}
      onMouseMove={handleMouseMove}
      style={
        {
          '--spotlight-x': `${mousePosition.x}px`,
          '--spotlight-y': `${mousePosition.y}px`,
          '--spotlight-color': spotlightColor,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default Spotlight;
