'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ShoppingCart, Bot, Zap, TrendingUp } from 'lucide-react';
import React, { useRef, useCallback } from 'react';

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
      dottedX.set(nx * 5);
      dottedY.set(ny * 5);
      greeblesX.set(nx * 10);
      greeblesY.set(ny * 10);
    },
    [dottedX, dottedY, greeblesX, greeblesY],
  );

  const handleMouseLeave = useCallback(() => {
    dottedX.set(0);
    dottedY.set(0);
    greeblesX.set(0);
    greeblesY.set(0);
  }, [dottedX, dottedY, greeblesX, greeblesY]);

  const shapes = [
    // 0: Diamond
    <rect key="s0" x="130" y="130" width="140" height="140" fill="none" stroke="#9333ea" strokeWidth="1.5" transform="rotate(45 200 200)" opacity="0.8" />,
    // 1: Circle
    <circle key="s1" cx="200" cy="200" r="85" fill="none" stroke="#9333ea" strokeWidth="1.5" opacity="0.8" />,
    // 2: Triangle
    <polygon key="s2" points="200,110 290,290 110,290" fill="none" stroke="#9333ea" strokeWidth="1.5" opacity="0.8" />,
    // 3: Hexagon
    <polygon key="s3" points="200,115 270,155 270,245 200,285 130,245 130,155" fill="none" stroke="#9333ea" strokeWidth="1.5" opacity="0.8" />,
  ];

  const dashedShapes = [
    // 0: Dashed square + inner diamond
    <>
      <rect key="d0a" x="110" y="110" width="180" height="180" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="7 5" opacity="0.4" />
      <rect key="d0b" x="155" y="155" width="90" height="90" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="5 4" transform="rotate(45 200 200)" opacity="0.3" />
    </>,
    // 1: Dashed square + inner circle
    <>
      <rect key="d1a" x="115" y="115" width="170" height="170" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="7 5" opacity="0.4" />
      <circle key="d1b" cx="200" cy="200" r="50" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.3" />
    </>,
    // 2: Dashed circle + inner triangle
    <>
      <circle key="d2a" cx="200" cy="200" r="105" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="7 5" opacity="0.4" />
      <polygon key="d2b" points="200,145 255,260 145,260" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.3" />
    </>,
    // 3: Dashed diamond + inner hexagon
    <>
      <rect key="d3a" x="135" y="135" width="130" height="130" fill="none" stroke="#7c3aed" strokeWidth="0.8" strokeDasharray="7 5" transform="rotate(45 200 200)" opacity="0.4" />
      <polygon key="d3b" points="200,150 240,175 240,225 200,250 160,225 160,175" fill="none" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="5 4" opacity="0.3" />
    </>,
  ];

  const v = variant % 4;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full flex items-center justify-center"
      style={{ height: '220px' }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.25,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(147,51,234,0.3) 0.5px, transparent 0.5px)',
          backgroundSize: '14px 14px',
        }}
      />

      {/* Purple glow center */}
      <div
        className="absolute rounded-full"
        style={{
          width: '55%',
          height: '55%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(147,51,234,0.35) 0%, rgba(124,58,237,0.2) 35%, rgba(88,28,135,0.08) 65%, transparent 100%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '30%',
          height: '30%',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(192,132,252,0.15) 50%, transparent 100%)',
          filter: 'blur(12px)',
        }}
      />

      {/* Fade edges */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to right, #1a1a1a 0%, transparent 15%, transparent 85%, #1a1a1a 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #1a1a1a 0%, transparent 15%, transparent 85%, #1a1a1a 100%)' }} />

      {/* Layer 0: Base shape */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {shapes[v]}
        </svg>
      </div>

      {/* Layer 1: Dashed (parallax 1x) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: dottedX, y: dottedY }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full">
          {dashedShapes[v]}
        </svg>
      </motion.div>

      {/* Layer 2: Corner brackets (parallax 2x) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: greeblesX, y: greeblesY }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <path d="M 75 115 L 75 75 L 115 75" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.45" />
          <path d="M 285 75 L 325 75 L 325 115" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.45" />
          <path d="M 75 285 L 75 325 L 115 325" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.45" />
          <path d="M 285 325 L 325 325 L 325 285" fill="none" stroke="#a855f7" strokeWidth="1.2" opacity="0.45" />
        </svg>
      </motion.div>
    </div>
  );
};

/* ─────────── Features Data ─────────── */
const FEATURES = [
  {
    title: 'Intuitive Marketplace',
    description: 'Discover, publish, and sell AI agents with zero friction. Full visibility into agent performance.',
    icon: ShoppingCart,
    details: ['Browse agents', 'Publish custom', 'Track revenue', 'Monetize'],
  },
  {
    title: 'Full-stack AI Agents',
    description: 'Deploy autonomous agents with complete control. Real-time execution and monitoring across your infrastructure.',
    icon: Bot,
    details: ['Custom logic', 'Real-time sync', 'Auto-scaling', 'Analytics'],
  },
  {
    title: 'Zero Ops Deployment',
    description: 'Deploy without operational overhead. Automatic scaling, monitoring, and maintenance included.',
    icon: Zap,
    details: ['Auto-scaling', 'Zero config', 'Built-in monitoring', 'Self-healing'],
  },
  {
    title: 'Real-time Analytics',
    description: 'Monitor agent performance with detailed metrics. Track usage, costs, and ROI in real-time dashboards.',
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
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        style={{ paddingTop: '60px' }}
      >
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group flex flex-col rounded-lg border overflow-hidden cursor-pointer transition-all duration-500"
              style={{
                borderColor: '#272727',
                background: '#1a1a1a',
              }}
              whileHover={{
                borderColor: 'rgba(147, 51, 234, 0.5)',
                boxShadow: '0 0 40px rgba(147, 51, 234, 0.15), 0 0 80px rgba(147, 51, 234, 0.05)',
                scale: 1.02,
                y: -4,
              }}
            >
              {/* Geometric figure */}
              <div className="relative overflow-hidden" style={{ background: '#141414' }}>
                <GeometricFigure variant={idx} />
              </div>

              {/* Content */}
              <div className="flex flex-col gap-4 p-6">
                {/* Icon + Title */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 group-hover:shadow-[0_0_16px_rgba(147,51,234,0.4)]"
                    style={{
                      background: '#9333ea',
                    }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <h3
                    className="text-white font-normal"
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
                    <div key={i} className="flex items-center gap-1.5 text-xs text-white/35">
                      <div className="w-1 h-1 rounded-full bg-purple-600/60" />
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
