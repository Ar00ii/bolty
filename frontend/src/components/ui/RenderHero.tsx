'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Activity } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RenderHeroProps {
  isAuthenticated?: boolean;
}

export function RenderHero({ isAuthenticated = false }: RenderHeroProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDeploying(true);
      const dashboardTimer = setTimeout(() => {
        setShowDashboard(true);
        setTimeout(() => {
          setIsDeploying(false);
        }, 3000);
      }, 1500);
      return () => clearTimeout(dashboardTimer);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%)' }}>
      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="render-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#render-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto min-h-screen flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT: Text & Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 flex flex-col justify-center"
          >
            <div>
              <h1 className="text-6xl md:text-7xl font-bold leading-tight text-white mb-4">
                Build, ship, and earn
                <br />
                <span style={{ color: '#a855f7' }}>with AI agents</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                The developer platform for publishing code, deploying AI agents, and earning from your work.
                Connect your stack, reach buyers, get paid in ETH.
              </p>
            </div>

            <div className="flex gap-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth?tab=register"
                    className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    Start building <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/market"
                    className="px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Explore marketplace
                  </Link>
                </>
              ) : (
                <Link
                  href="/market"
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Go to dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Deploy + Cards (floating) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-96 flex items-center justify-center"
          >
            {/* Deploy Button */}
            <motion.button
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute top-0 left-1/2 transform -translate-x-1/2 px-8 py-3 rounded-lg font-mono text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors z-20"
            >
              deploy
            </motion.button>

            {/* Arrow line - vertical */}
            <svg width="3" height="80" viewBox="0 0 3 80" className="absolute top-20 left-1/2 transform -translate-x-1/2" style={{ pointerEvents: 'none' }}>
              <motion.line
                x1="1.5"
                y1="0"
                x2="1.5"
                y2="80"
                stroke="#a855f7"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={isDeploying ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.2 }}
              />
            </svg>

            {/* Cards - positioned around the center, floating */}
            {showDashboard && (
              <>
                {/* Card 1 - Top Left */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute w-48 border border-white/20 rounded-lg p-4"
                  style={{ background: 'rgba(168, 85, 247, 0.15)', top: '20%', left: '-20%' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-gray-500 uppercase">AI Agent</span>
                  </div>
                  <div className="text-sm text-green-400 font-medium mb-3">Deploying</div>
                  <div className="flex gap-1 h-12 items-end">
                    {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8].map((h, i) => (
                      <div key={i} className="flex-1 bg-purple-500/60 rounded" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                </motion.div>

                {/* Card 2 - Right Middle */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute w-48 border border-white/20 rounded-lg p-4"
                  style={{ background: 'rgba(6, 182, 212, 0.15)', top: '50%', right: '-20%', transform: 'translateY(-50%)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-gray-500 uppercase">ETH Pay</span>
                  </div>
                  <div className="text-sm text-green-400 font-medium mb-3 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Available
                  </div>
                  <div className="flex gap-1 h-12 items-end">
                    {[0.4, 0.45, 0.42, 0.48, 0.44, 0.5].map((h, i) => (
                      <div key={i} className="flex-1 bg-cyan-500/60 rounded" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                </motion.div>

                {/* Card 3 - Bottom Left */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute w-48 border border-white/20 rounded-lg p-4"
                  style={{ background: 'rgba(236, 72, 153, 0.15)', bottom: '0%', left: '-20%' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-pink-400" />
                    <span className="text-xs text-gray-500 uppercase">Database</span>
                  </div>
                  <div className="text-sm text-green-400 font-medium mb-3 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Available
                  </div>
                  <div className="flex gap-1 h-12 items-end">
                    {[0.5, 0.55, 0.52, 0.58, 0.54, 0.6].map((h, i) => (
                      <div key={i} className="flex-1 bg-pink-500/60 rounded" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                </motion.div>

                {/* Card 4 - Bottom Right */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute w-48 border border-white/20 rounded-lg p-4"
                  style={{ background: 'rgba(34, 197, 94, 0.15)', bottom: '0%', right: '-20%' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-gray-500 uppercase">Cache</span>
                  </div>
                  <div className="text-sm text-green-400 font-medium mb-3 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Available
                  </div>
                  <div className="flex gap-1 h-12 items-end">
                    {[0.6, 0.62, 0.64, 0.66, 0.68, 0.65].map((h, i) => (
                      <div key={i} className="flex-1 bg-green-500/60 rounded" style={{ height: `${h * 100}%` }} />
                    ))}
                  </div>
                </motion.div>

                {/* Card 5 - Center Right (wider) */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.0 }}
                  className="absolute w-56 border border-white/20 rounded-lg p-4"
                  style={{ background: 'rgba(0, 0, 0, 0.6)', right: '-25%', top: '50%', transform: 'translateY(-50%)' }}
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-2">Instances</div>
                      <div className="text-xl font-bold text-white">3</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-2">Requests/s</div>
                      <div className="text-xl font-bold text-white">1.2k</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase mb-2">Uptime</div>
                      <div className="text-xl font-bold text-white">99.9%</div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
