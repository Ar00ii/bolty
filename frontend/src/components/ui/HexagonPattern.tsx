import React from 'react';

interface HexagonPatternProps {
  hexagons: [number, number][];
  className?: string;
}

export function HexagonPattern({ hexagons, className = '' }: HexagonPatternProps) {
  const hexSize = 50;
  const hexWidth = hexSize * 2;
  const hexHeight = hexSize * Math.sqrt(3);

  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      viewBox={`0 0 1000 1000`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        opacity: 0.4,
      }}
    >
      <defs>
        <pattern
          id="hexagon"
          x="0"
          y="0"
          width={hexWidth}
          height={hexHeight}
          patternUnits="userSpaceOnUse"
        >
          <polygon
            points={`${hexSize},0 ${hexSize * 2},${hexHeight / 2} ${hexSize * 2},${hexHeight * 1.5} ${hexSize},${hexHeight * 2} 0,${hexHeight * 1.5} 0,${hexHeight / 2}`}
            fill="none"
            stroke="rgba(168, 85, 247, 0.3)"
            strokeWidth="1"
          />
        </pattern>
      </defs>

      {/* Render hexagons */}
      {hexagons.map((pos, i) => {
        const x = pos[0] * hexWidth;
        const y = pos[1] * hexHeight;
        const points = `${x + hexSize},${y} ${x + hexSize * 2},${y + hexHeight / 2} ${x + hexSize * 2},${y + hexHeight * 1.5} ${x + hexSize},${y + hexHeight * 2} ${x},${y + hexHeight * 1.5} ${x},${y + hexHeight / 2}`;

        return (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(168, 85, 247, 0.4)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}
