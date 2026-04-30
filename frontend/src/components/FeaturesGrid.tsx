'use client';

import { motion, useSpring } from 'framer-motion';
import { ShoppingCart, Bot, Zap, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import React, { useRef, useCallback } from 'react';

const ShapeGrid = dynamic(() => import('@/components/ui/ShapeGrid'), { ssr: false });

/* ─── CSS for animated dashed lines (marching ants) ─── */
const dashAnimationCSS = `
@keyframes dashMove {
  to { stroke-dashoffset: -40; }
}
.dash-animate {
  animation: dashMove 4s linear infinite;
}
.dash-animate-slow {
  animation: dashMove 6s linear infinite;
}
`;

/* ─────────── Geometric Figure with Parallax ─────────── */
const GeometricFigure = ({ variant }: { variant: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 20, stiffness: 120 };
  const dottedX = useSpring(0, springConfig);
  const dottedY = useSpring(0, springConfig);
  const greeblesX = useSpring(0, springConfig);
  const greeblesY = useSpring(0, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      dottedX.set(nx * 6);
      dottedY.set(ny * 6);
      greeblesX.set(nx * 12);
      greeblesY.set(ny * 12);
    },
    [dottedX, dottedY, greeblesX, greeblesY],
  );

  const handleMouseLeave = useCallback(() => {
    dottedX.set(0);
    dottedY.set(0);
    greeblesX.set(0);
    greeblesY.set(0);
  }, [dottedX, dottedY, greeblesX, greeblesY]);

  // Bigger shapes (viewBox 0 0 400 400, shapes scaled up)
  const shapes = [
    // 0: Diamond
    <rect
      key="s0"
      x="105"
      y="105"
      width="190"
      height="190"
      fill="none"
      stroke="#9333ea"
      strokeWidth="1.5"
      transform="rotate(45 200 200)"
      opacity="0.85"
    />,
    // 1: Circle
    <circle
      key="s1"
      cx="200"
      cy="200"
      r="110"
      fill="none"
      stroke="#9333ea"
      strokeWidth="1.5"
      opacity="0.85"
    />,
    // 2: Triangle
    <polygon
      key="s2"
      points="200,75 320,310 80,310"
      fill="none"
      stroke="#9333ea"
      strokeWidth="1.5"
      opacity="0.85"
    />,
    // 3: Hexagon
    <polygon
      key="s3"
      points="200,85 290,140 290,260 200,315 110,260 110,140"
      fill="none"
      stroke="#9333ea"
      strokeWidth="1.5"
      opacity="0.85"
    />,
  ];

  const dashedShapes = [
    // 0: Dashed square + inner diamond
    <>
      <rect
        key="d0a"
        x="80"
        y="80"
        width="240"
        height="240"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeDasharray="10 7"
        opacity="0.65"
        className="dash-animate"
      />
      <rect
        key="d0b"
        x="140"
        y="140"
        width="120"
        height="120"
        fill="none"
        stroke="#a855f7"
        strokeWidth="1.2"
        strokeDasharray="8 6"
        transform="rotate(45 200 200)"
        opacity="0.5"
        className="dash-animate-slow"
      />
    </>,
    // 1: Dashed square + inner circle
    <>
      <rect
        key="d1a"
        x="85"
        y="85"
        width="230"
        height="230"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeDasharray="10 7"
        opacity="0.65"
        className="dash-animate"
      />
      <circle
        key="d1b"
        cx="200"
        cy="200"
        r="65"
        fill="none"
        stroke="#a855f7"
        strokeWidth="1.2"
        strokeDasharray="8 6"
        opacity="0.5"
        className="dash-animate-slow"
      />
    </>,
    // 2: Dashed circle + inner triangle
    <>
      <circle
        key="d2a"
        cx="200"
        cy="200"
        r="130"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeDasharray="10 7"
        opacity="0.65"
        className="dash-animate"
      />
      <polygon
        key="d2b"
        points="200,120 275,275 125,275"
        fill="none"
        stroke="#a855f7"
        strokeWidth="1.2"
        strokeDasharray="8 6"
        opacity="0.5"
        className="dash-animate-slow"
      />
    </>,
    // 3: Dashed diamond + inner hexagon
    <>
      <rect
        key="d3a"
        x="115"
        y="115"
        width="170"
        height="170"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="1.5"
        strokeDasharray="10 7"
        transform="rotate(45 200 200)"
        opacity="0.65"
        className="dash-animate"
      />
      <polygon
        key="d3b"
        points="200,125 260,165 260,235 200,275 140,235 140,165"
        fill="none"
        stroke="#a855f7"
        strokeWidth="1.2"
        strokeDasharray="8 6"
        opacity="0.5"
        className="dash-animate-slow"
      />
    </>,
  ];

  const v = variant % 4;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full flex items-center justify-center"
      style={{ height: '300px' }}
    >
      {/* Hex grid background */}
      <div className="absolute inset-0 opacity-40">
        <ShapeGrid
          shape="hexagon"
          direction="diagonal"
          speed={0.3}
          squareSize={22}
          borderColor="rgba(147, 51, 234, 0.15)"
          hoverFillColor="rgba(147, 51, 234, 0.12)"
          hoverTrailAmount={4}
        />
      </div>

      {/* Purple glow center */}
      <div
        className="absolute rounded-full"
        style={{
          width: '60%',
          height: '60%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(124,58,237,0.22) 35%, rgba(88,28,135,0.08) 65%, transparent 100%)',
          filter: 'blur(22px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '35%',
          height: '35%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background:
            'radial-gradient(circle, rgba(20, 241, 149,0.45) 0%, rgba(192,132,252,0.18) 50%, transparent 100%)',
          filter: 'blur(14px)',
        }}
      />

      {/* Fade edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, #1a1a1a 0%, transparent 12%, transparent 88%, #1a1a1a 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, #1a1a1a 0%, transparent 12%, transparent 88%, #1a1a1a 100%)',
        }}
      />

      {/* Layer 0: Base shape */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {shapes[v]}
        </svg>
      </div>

      {/* Layer 1: Dashed with marching animation (parallax 1x) */}
      <motion.div className="absolute inset-0" style={{ x: dottedX, y: dottedY }}>
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {dashedShapes[v]}
        </svg>
      </motion.div>

      {/* Layer 2: Corner brackets (parallax 2x) */}
      <motion.div className="absolute inset-0" style={{ x: greeblesX, y: greeblesY }}>
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <path
            d="M 55 100 L 55 55 L 100 55"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <path
            d="M 300 55 L 345 55 L 345 100"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <path
            d="M 55 300 L 55 345 L 100 345"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            opacity="0.5"
          />
          <path
            d="M 300 345 L 345 345 L 345 300"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            opacity="0.5"
          />
        </svg>
      </motion.div>
    </div>
  );
};

/* ─────────── Features Data ─────────── */
const FEATURES = [
  {
    title: 'Intuitive Marketplace',
    description:
      'Discover, publish, and sell AI agents with zero friction. Full visibility into agent performance.',
    icon: ShoppingCart,
    details: ['Browse agents', 'Publish custom', 'Track revenue', 'Monetize'],
  },
  {
    title: 'Full-stack AI Agents',
    description:
      'Deploy autonomous agents with complete control. Real-time execution and monitoring across your infrastructure.',
    icon: Bot,
    details: ['Custom logic', 'Real-time sync', 'Auto-scaling', 'Analytics'],
  },
  {
    title: 'Zero Ops Deployment',
    description:
      'Deploy without operational overhead. Automatic scaling, monitoring, and maintenance included.',
    icon: Zap,
    details: ['Auto-scaling', 'Zero config', 'Built-in monitoring', 'Self-healing'],
  },
  {
    title: 'Real-time Analytics',
    description:
      'Monitor agent performance with detailed metrics. Track usage, costs, and ROI in real-time dashboards.',
    icon: TrendingUp,
    details: ['Live metrics', 'Cost tracking', 'Performance data', 'Insights'],
  },
];

/* ─────────── Main Component ─────────── */
export const FeaturesGrid = () => {
  return (
    <section
      className="flex flex-col gap-2 py-20 px-[7%] max-w-[1810px] mx-auto relative"
      style={{ background: '#0d0d0d' }}
    >
      {/* Inject dash animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: dashAnimationCSS }} />

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-white"
        style={{
          fontSize: '64px',
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: '-1.28px',
        }}
      >
        Powerful features built for builders
      </motion.h2>

      <p
        className="text-white/60"
        style={{
          fontSize: '20px',
          lineHeight: '1.5',
          maxWidth: '520px',
          marginTop: '16px',
        }}
      >
        Everything you need to deploy, manage, and monetize AI agents at scale.
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ paddingTop: '60px' }}>
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group flex flex-col rounded-lg border overflow-hidden cursor-pointer"
              style={{
                borderColor: '#272727',
                background: '#1a1a1a',
              }}
              whileHover={{
                borderColor: 'rgba(147, 51, 234, 0.7)',
                boxShadow:
                  '0 0 60px rgba(147, 51, 234, 0.3), 0 0 120px rgba(147, 51, 234, 0.12), inset 0 1px 40px rgba(147, 51, 234, 0.06)',
                scale: 1.04,
                y: -8,
              }}
            >
              {/* Geometric figure */}
              <div
                className="relative overflow-hidden transition-all duration-500 group-hover:brightness-150"
                style={{ background: '#141414' }}
              >
                <GeometricFigure variant={idx} />
              </div>

              {/* Divider line */}
              <div className="h-px bg-[#272727] group-hover:bg-bolty-600/40 transition-colors duration-500" />

              {/* Content */}
              <div className="flex flex-col gap-4 p-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 group-hover:shadow-[0_0_28px_rgba(147,51,234,0.6)] group-hover:scale-125"
                    style={{ background: '#9333ea' }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3
                    className="text-white font-normal transition-colors duration-300 group-hover:text-bolty-200"
                    style={{
                      fontSize: '22px',
                      lineHeight: 1.2,
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {feature.title}
                  </h3>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.5,
                    color: '#a0a0a0',
                  }}
                >
                  {feature.description}
                </p>

                {/* Details */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-2">
                  {feature.details.map((detail, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 text-xs text-white/35 group-hover:text-white/50 transition-colors duration-300"
                    >
                      <div className="w-1 h-1 rounded-full bg-bolty-600/60 group-hover:bg-bolty-400/80 transition-colors duration-300" />
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
