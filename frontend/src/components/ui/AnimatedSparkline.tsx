'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  animated?: boolean;
}

export function AnimatedSparkline({
  data,
  color = '#a855f7',
  height = 60,
  width = 100,
  animated = true,
}: AnimatedSparklineProps) {
  const svgRef = useRef<SVGPolylineElement>(null);

  // Generate points for the polyline
  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - value * height;
      return `${x},${y}`;
    })
    .join(' ');

  const pathLength = data.length * 10; // Approximate length

  useEffect(() => {
    if (animated && svgRef.current) {
      // Animate stroke-dashoffset
      const animate = () => {
        if (svgRef.current) {
          svgRef.current.style.strokeDasharray = `${pathLength}`;
          svgRef.current.style.strokeDashoffset = `${pathLength}`;

          requestAnimationFrame(() => {
            if (svgRef.current) {
              svgRef.current.style.transition = 'stroke-dashoffset 2s ease-out';
              svgRef.current.style.strokeDashoffset = '0';
            }
          });
        }
      };
      animate();
    }
  }, [pathLength, animated]);

  return (
    <motion.svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
    >
      <polyline
        ref={svgRef}
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </motion.svg>
  );
}
