'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ShoppingCart, Bot, Zap, TrendingUp, Check } from 'lucide-react';
import React, { useRef, useCallback } from 'react';

/* ─────────── Geometric Figure with Parallax ─────────── */
interface GeoFigureProps {
  variant: number;
}

const GeometricFigure = ({ variant }: GeoFigureProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 25, stiffness: 150 };
  const dottedX = useSpring(0, springConfig);
  const dottedY = useSpring(0, springConfig);
  const greeblesX = useSpring(0, springConfig);
  const greeblesY = useSpring(0, springConfig);

  const FACTOR_DOTTED = 6;
  const FACTOR_GREEBLES = 12;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      dottedX.set(nx * FACTOR_DOTTED);
      dottedY.set(ny * FACTOR_DOTTED);
      greeblesX.set(nx * FACTOR_GREEBLES);
      greeblesY.set(ny * FACTOR_GREEBLES);
    },
    [dottedX, dottedY, greeblesX, greeblesY],
  );

  const handleMouseLeave = useCallback(() => {
    dottedX.set(0);
    dottedY.set(0);
    greeblesX.set(0);
    greeblesY.set(0);
  }, [dottedX, dottedY, greeblesX, greeblesY]);

  // Different blob colors per variant
  const blobs = [
    // Marketplace: cyan + purple
    [
      { color: 'rgba(34,211,238,0.45)', top: '20%', left: '28%', size: '50%' },
      { color: 'rgba(168,85,247,0.4)', bottom: '22%', right: '25%', size: '45%' },
      { color: 'rgba(250,204,21,0.25)', bottom: '30%', left: '35%', size: '35%' },
    ],
    // Agents: blue + purple
    [
      { color: 'rgba(59,130,246,0.5)', top: '20%', left: '25%', size: '50%' },
      { color: 'rgba(168,85,247,0.45)', bottom: '20%', right: '28%', size: '45%' },
      { color: 'rgba(34,211,238,0.3)', top: '35%', right: '20%', size: '35%' },
    ],
    // Zero Ops: purple + emerald
    [
      { color: 'rgba(168,85,247,0.5)', top: '22%', left: '30%', size: '48%' },
      { color: 'rgba(16,185,129,0.45)', bottom: '20%', right: '25%', size: '45%' },
      { color: 'rgba(59,130,246,0.3)', bottom: '28%', left: '22%', size: '38%' },
    ],
    // Analytics: emerald + cyan
    [
      { color: 'rgba(16,185,129,0.5)', top: '22%', left: '28%', size: '48%' },
      { color: 'rgba(34,211,238,0.45)', bottom: '22%', right: '25%', size: '45%' },
      { color: 'rgba(168,85,247,0.3)', top: '30%', right: '22%', size: '38%' },
    ],
  ];

  // Different geometric shapes per variant
  const shapes = [
    // 0: Diamond + dashed square
    <>
      <rect x="130" y="130" width="140" height="140" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 200 200)" className="text-white/70" />
    </>,
    // 1: Circle + hexagon
    <>
      <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70" />
    </>,
    // 2: Triangle + inner triangle
    <>
      <polygon points="200,100 300,300 100,300" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70" />
    </>,
    // 3: Octagon
    <>
      <polygon points="160,110 240,110 290,160 290,240 240,290 160,290 110,240 110,160" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/70" />
    </>,
  ];

  const dashedShapes = [
    // 0: Dashed square + inner dashed diamond
    <>
      <rect x="115" y="115" width="170" height="170" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" className="text-white/30" />
      <rect x="155" y="155" width="90" height="90" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 5" transform="rotate(45 200 200)" className="text-white/25" />
    </>,
    // 1: Dashed square + inner circle
    <>
      <rect x="120" y="120" width="160" height="160" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" className="text-white/30" />
      <circle cx="200" cy="200" r="55" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 5" className="text-white/25" />
    </>,
    // 2: Dashed circle + inner triangle
    <>
      <circle cx="200" cy="200" r="110" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" className="text-white/30" />
      <polygon points="200,140 250,260 150,260" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 5" className="text-white/25" />
    </>,
    // 3: Dashed diamond + inner square
    <>
      <rect x="130" y="130" width="140" height="140" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" transform="rotate(45 200 200)" className="text-white/30" />
      <rect x="160" y="160" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 5" className="text-white/25" />
    </>,
  ];

  const labels = [
    { top: '// 001', bottom: '// MARKETPLACE' },
    { top: '// 002', bottom: '// AGENTS' },
    { top: '// 003', bottom: '// DEPLOYMENT' },
    { top: '// 004', bottom: '// ANALYTICS' },
  ];

  const v = variant % 4;
  const currentBlobs = blobs[v];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-square flex items-center justify-center"
      style={{ maxWidth: '380px', margin: '0 auto' }}
    >
      {/* Dot background inside figure area */}
      <div
        className="absolute inset-0 rounded"
        style={{
          opacity: 0.35,
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 0.6px, transparent 0.6px)',
          backgroundSize: '14px 14px',
        }}
      />
      {/* Fade edges */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#0d0d0d] via-transparent to-transparent opacity-90" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tl from-[#0d0d0d] via-transparent to-transparent opacity-90" />

      {/* Layer 0: Base - solid shapes + color blobs */}
      <div className="absolute inset-0 flex items-center justify-center">
        {currentBlobs.map((blob, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: blob.size,
              height: blob.size,
              background: `radial-gradient(circle, ${blob.color} 0%, transparent 70%)`,
              top: blob.top,
              left: blob.left,
              bottom: (blob as Record<string, string>).bottom,
              right: (blob as Record<string, string>).right,
              filter: 'blur(25px)',
            }}
          />
        ))}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {shapes[v]}
        </svg>
      </div>

      {/* Layer 1: Dotted lines (parallax 1x) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ x: dottedX, y: dottedY }}
      >
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {dashedShapes[v]}
        </svg>
      </motion.div>

      {/* Layer 2: Greebles (parallax 2x) */}
      <motion.div
        className="absolute inset-0"
        style={{ x: greeblesX, y: greeblesY }}
      >
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {/* Corner brackets */}
          <path d="M 70 110 L 70 70 L 110 70" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40" />
          <path d="M 290 70 L 330 70 L 330 110" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40" />
          <path d="M 70 290 L 70 330 L 110 330" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40" />
          <path d="M 290 330 L 330 330 L 330 290" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/40" />
          {/* Labels */}
          <text x="305" y="58" fill="currentColor" fontSize="10" fontFamily="monospace" className="text-white/35">
            {labels[v].top}
          </text>
          <text x="240" y="352" fill="currentColor" fontSize="10" fontFamily="monospace" className="text-white/35">
            {labels[v].bottom}
          </text>
        </svg>
      </motion.div>
    </div>
  );
};

/* ─────────── Visual components for each feature ─────────── */
const MarketplaceVisual = () => (
  <div className="space-y-2.5 text-xs">
    <div className="flex justify-between text-white/40 px-1">
      <span>Agent Name</span>
      <span>Status</span>
    </div>
    {['GPT-4 Analyzer', 'Voice Bot', 'Data Scraper'].map((name, i) => (
      <div key={i} className="flex items-center justify-between py-2 px-1 border-b border-white/10">
        <span className="text-white/70">{name}</span>
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      </div>
    ))}
  </div>
);

const AgentsVisual = () => (
  <div className="text-xs">
    <div className="bg-black/50 rounded p-3 font-mono text-emerald-400/80">
      <div>{'{'}</div>
      <div className="ml-3">&quot;agent&quot;: &quot;autonomous&quot;,</div>
      <div className="ml-3">&quot;status&quot;: &quot;active&quot;</div>
      <div>{'}'}</div>
    </div>
  </div>
);

const ZeroOpsVisual = () => (
  <div className="space-y-2">
    <div className="flex items-end gap-1 h-14">
      {[40, 60, 45, 75, 55, 80].map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t"
          style={{
            height: `${h}%`,
            background: `linear-gradient(to top, rgba(168,85,247,0.6), rgba(168,85,247,0.25))`,
          }}
        />
      ))}
    </div>
    <div className="text-[10px] text-white/40 text-center font-mono">Auto-scaling</div>
  </div>
);

const AnalyticsVisual = () => (
  <div className="grid grid-cols-2 gap-2 text-xs">
    {[
      { label: 'Requests', value: '12.5K' },
      { label: 'Avg Time', value: '142ms' },
      { label: 'Success', value: '99.8%' },
      { label: 'Cost', value: '$234' },
    ].map((item, i) => (
      <div key={i} className="bg-black/40 rounded p-2">
        <div className="text-white/35 text-[10px]">{item.label}</div>
        <div className="text-emerald-400/80 font-mono text-sm">{item.value}</div>
      </div>
    ))}
  </div>
);

/* ─────────── Features Data ─────────── */
const FEATURES = [
  {
    number: 1,
    tag: 'DISCOVER, PUBLISH, MONETIZE',
    title: 'Intuitive Marketplace',
    description:
      'Discover, publish, and sell AI agents with zero friction. Full visibility into agent performance.',
    details: ['Browse agents', 'Publish custom', 'Track revenue', 'Monetize'],
    icon: <ShoppingCart className="w-5 h-5" />,
    visual: <MarketplaceVisual />,
    ctaHref: '/market/agents',
  },
  {
    number: 2,
    tag: 'AUTONOMOUS, INTELLIGENT, SCALABLE',
    title: 'Full-stack AI Agents',
    description:
      'Deploy autonomous agents with complete control. Real-time execution and monitoring across your infrastructure.',
    details: ['Custom logic', 'Real-time sync', 'Auto-scaling', 'Analytics'],
    icon: <Bot className="w-5 h-5" />,
    visual: <AgentsVisual />,
    ctaHref: '/market/agents',
  },
  {
    number: 3,
    tag: 'ZERO CONFIG, AUTO-SCALING, RELIABLE',
    title: 'Zero Ops Deployment',
    description:
      'Deploy without operational overhead. Automatic scaling, monitoring, and maintenance included.',
    details: ['Auto-scaling', 'Zero config', 'Built-in monitoring', 'Self-healing'],
    icon: <Zap className="w-5 h-5" />,
    visual: <ZeroOpsVisual />,
    ctaHref: '/profile?tab=agent',
  },
  {
    number: 4,
    tag: 'REAL-TIME, PRECISE, ACTIONABLE',
    title: 'Real-time Analytics',
    description:
      'Monitor agent performance with detailed metrics. Track usage, costs, and ROI in real-time dashboards.',
    details: ['Live metrics', 'Cost tracking', 'Performance data', 'Insights'],
    icon: <TrendingUp className="w-5 h-5" />,
    visual: <AnalyticsVisual />,
    ctaHref: '/profile?tab=analytics',
  },
];

/* ─────────── Main Component ─────────── */
export const FeaturesGrid = () => {
  return (
    <div className="flex flex-col">
      {FEATURES.map((feature, idx) => (
        <motion.section
          key={idx}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-100px' }}
          className="relative w-full overflow-hidden border-t border-white/[0.06]"
          style={{ minHeight: '100vh' }}
        >
          {/* Dot grid background */}
          <div
            className="absolute inset-0"
            style={{
              opacity: 0.3,
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 0.6px, transparent 0.6px)',
              backgroundSize: '17.5px 17.5px',
            }}
          />
          {/* Fade edges */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#0d0d0d] via-transparent to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tl from-[#0d0d0d] via-transparent to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-[#0d0d0d]/80 via-transparent to-transparent" />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-bl from-[#0d0d0d]/80 via-transparent to-transparent" />

          {/* Content */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 flex items-center min-h-screen">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full ${idx % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>

              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                className={idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}
              >
                {/* Icon badge */}
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-6 text-white"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
                >
                  {feature.icon}
                </div>

                <h2
                  className="text-white mb-5"
                  style={{
                    fontSize: 'clamp(32px, 4.5vw, 52px)',
                    fontWeight: 300,
                    lineHeight: 1.1,
                    letterSpacing: '-1.2px',
                  }}
                >
                  {feature.title}
                </h2>

                <p
                  className="text-white/55 mb-8"
                  style={{
                    fontSize: 'clamp(15px, 1.6vw, 19px)',
                    lineHeight: 1.65,
                    maxWidth: '460px',
                  }}
                >
                  {feature.description}
                </p>

                {/* Visual preview */}
                <div
                  className="mb-8 p-4 rounded-lg"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    maxWidth: '360px',
                  }}
                >
                  {feature.visual}
                </div>

                {/* Details */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8">
                  {feature.details.map((detail, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/40 font-mono">
                      <div className="w-1 h-1 rounded-full bg-purple-500/60" />
                      {detail}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <a
                  href={feature.ctaHref}
                  className="inline-block px-5 py-2.5 border border-white/20 text-white text-[11px] font-mono tracking-[0.15em] uppercase hover:bg-white hover:text-black transition-all duration-300"
                >
                  Learn more
                </a>
              </motion.div>

              {/* Geometric figure side */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
                className={`flex items-center justify-center ${idx % 2 === 1 ? 'lg:[direction:ltr]' : ''}`}
              >
                <GeometricFigure variant={idx} />
              </motion.div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-6 left-6 md:left-12 right-6 md:right-12 flex items-center gap-4 z-10">
            <span className="text-white/40 text-sm font-mono">{feature.number}</span>
            <div className="w-12 h-px bg-white/20" />
            <span className="text-white/30 text-[11px] font-mono tracking-[0.2em]">
              {feature.tag}
            </span>
          </div>
        </motion.section>
      ))}
    </div>
  );
};
