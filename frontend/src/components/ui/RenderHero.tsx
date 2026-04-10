import { motion } from 'framer-motion';
import { CheckCircle2, Activity } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { useState, useEffect } from 'react';

interface RenderHeroProps {
  isAuthenticated?: boolean;
}

export function RenderHero({ isAuthenticated = false }: RenderHeroProps) {
  const [phase, setPhase] = useState<'idle' | 'pressed' | 'deploying' | 'done'>('idle');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('pressed'), 1200);
    const t2 = setTimeout(() => setPhase('deploying'), 1800);
    const t3 = setTimeout(() => setPhase('done'), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showDashboard = phase === 'deploying' || phase === 'done';

  return (
    <div
      className="relative min-h-screen pt-32 pb-20 px-4 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%)' }}
    >
      {/* Grid overlay with parallax */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="render-grid"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <rect
                x="0"
                y="0"
                width="80"
                height="80"
                fill="none"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#render-grid)" />
        </svg>
      </div>

      <div
        className="relative z-10 max-w-7xl mx-auto"
        style={{ transform: `translateY(${scrollY * 0.3}px)` }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-20">
          {/* LEFT */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-5xl lg:text-6xl font-light leading-tight text-white mb-6">
                Build, ship, and earn
                <br />
                with
                <br />
                <span style={{ color: '#a855f7' }}>AI agents</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                Deploy AI agents and applications at scale. Ship faster, earn directly, reach global
                markets with zero friction.
              </p>
            </div>

            <div className="flex gap-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth?tab=register"
                    className="px-8 py-3 bg-white text-black font-light rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    Start building <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="px-8 py-3 border border-white text-white font-light rounded hover:bg-white/10 transition-colors"
                  >
                    Get in touch
                  </Link>
                </>
              ) : (
                <Link
                  href="/market"
                  className="px-8 py-3 bg-white text-black font-light rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Go to dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>

          {/* RIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Deploy Button */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: phase === 'pressed' ? 0.95 : 1,
                boxShadow:
                  phase === 'deploying'
                    ? '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.3)'
                    : phase === 'done'
                      ? '0 0 20px rgba(34, 197, 94, 0.5)'
                      : '0 0 0px rgba(168, 85, 247, 0)',
              }}
              transition={{ delay: phase === 'idle' ? 0.4 : 0, duration: 0.3 }}
              className={`absolute -top-12 right-4 z-20 px-6 py-2.5 rounded-lg text-sm font-light cursor-default flex items-center gap-2 transition-colors duration-300 ${
                phase === 'done'
                  ? 'bg-green-600 text-white'
                  : phase === 'deploying'
                    ? 'bg-purple-500 text-white'
                    : 'bg-purple-600 text-white'
              }`}
            >
              {phase === 'deploying' && <CheckCircle2 className="w-4 h-4 animate-spin" />}
              {phase === 'done' && <CheckCircle2 className="w-4 h-4" />}
              {phase === 'idle' || phase === 'pressed'
                ? 'Deploy'
                : phase === 'deploying'
                  ? 'Deploying...'
                  : 'Deployed'}
            </motion.div>

            {/* Arrow line - better positioned */}
            <svg
              width="2"
              height="120"
              viewBox="0 0 2 120"
              className="absolute left-1/2 -translate-x-1/2 z-10"
              style={{ pointerEvents: 'none', top: '35px' }}
            >
              <defs>
                <linearGradient id="arrowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <motion.line
                x1="1"
                y1="0"
                x2="1"
                y2="120"
                stroke="url(#arrowGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={
                  phase !== 'idle' ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }
                }
                transition={{ duration: 1.2, delay: 0.3 }}
              />
            </svg>

            {/* Dashboard */}
            {showDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="border border-white/15 rounded-xl p-8 pt-24"
                style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(20px)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-xs uppercase tracking-widest text-gray-500">
                    Bolty Dashboard
                  </div>
                  {phase === 'done' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 text-xs text-green-400"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      All systems live
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {[
                    {
                      name: 'AI Agent',
                      metric: 'Requests',
                      color: 'purple',
                      bars: [0.3, 0.5, 0.4, 0.7, 0.6, 0.8],
                      status: phase === 'done' ? 'Live' : 'Deploying',
                      statusColor: phase === 'done' ? 'text-green-400' : 'text-yellow-400',
                    },
                    {
                      name: 'Marketplace',
                      metric: 'Sales',
                      color: 'cyan',
                      bars: [0.4, 0.45, 0.5, 0.48, 0.55, 0.6],
                      status: 'Live',
                      statusColor: 'text-green-400',
                    },
                    {
                      name: 'ETH Payments',
                      metric: 'Volume',
                      color: 'pink',
                      bars: [0.5, 0.55, 0.52, 0.58, 0.62, 0.7],
                      status: 'Active',
                      statusColor: 'text-green-400',
                    },
                    {
                      name: 'Repos',
                      metric: 'Commits',
                      color: 'purple',
                      bars: [0.4, 0.5, 0.45, 0.55, 0.48, 0.6],
                      status: '24 synced',
                      statusColor: 'text-green-400',
                    },
                    {
                      name: 'Users',
                      metric: 'Growth',
                      color: 'cyan',
                      bars: [0.35, 0.48, 0.52, 0.56, 0.6, 0.65],
                      status: '1.2k',
                      statusColor: 'text-green-400',
                    },
                    {
                      name: 'Uptime',
                      metric: 'Status',
                      color: 'green',
                      bars: [0.88, 0.9, 0.92, 0.91, 0.93, 0.95],
                      status: '99.9%',
                      statusColor: 'text-green-400',
                    },
                  ].map((card, i) => (
                    <motion.div
                      key={card.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 * i, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="border border-white/10 rounded-lg p-4"
                      style={{ background: 'rgba(0, 0, 0, 0.4)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className={`w-3.5 h-3.5 text-${card.color}-400`} />
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                          {card.name}
                        </span>
                      </div>
                      <div
                        className={`${card.statusColor} text-xs font-light mb-3 flex items-center gap-1`}
                      >
                        {card.status === 'Live' || card.status === 'Active' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : null}
                        {card.status}
                      </div>
                      <div className="text-[10px] text-gray-600 mb-1">{card.metric}</div>
                      <div className="flex gap-0.5 h-7 items-end">
                        {card.bars.map((h, j) => (
                          <motion.div
                            key={j}
                            initial={{ height: 0 }}
                            animate={{ height: `${h * 100}%` }}
                            transition={{ delay: 0.15 * i + 0.05 * j, duration: 0.4 }}
                            className={`flex-1 bg-${card.color}-500/50 rounded-sm`}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
