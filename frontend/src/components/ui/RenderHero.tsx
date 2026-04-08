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
      {/* Grid overlay - full background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="render-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="80" height="80" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#render-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start pt-20">
          {/* LEFT: Text & Buttons */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white mb-6">
                Your fastest path to
                <br />
                production for
                <br />
                <span style={{ color: '#a855f7' }}>AI agents & apps</span>
              </h1>
              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                Deploy AI agents and applications at scale. Ship faster, earn directly, reach global markets with zero friction.
              </p>
            </div>

            <div className="flex gap-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth?tab=register"
                    className="px-8 py-3 bg-white text-black font-medium rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                  >
                    Start building <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="px-8 py-3 border border-white text-white font-medium rounded hover:bg-white/10 transition-colors"
                  >
                    Get in touch
                  </Link>
                </>
              ) : (
                <Link
                  href="/market"
                  className="px-8 py-3 bg-white text-black font-medium rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Go to dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Dashboard Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Deploy Button - top right */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-12 right-4 z-20 px-6 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white cursor-default"
            >
              Deploy
            </motion.div>

            {/* Arrow line */}
            <svg width="3" height="80" viewBox="0 0 3 80" className="absolute top-0 right-20" style={{ pointerEvents: 'none', zIndex: 15 }}>
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

            {/* Dashboard Grid Container */}
            {showDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="border border-white/20 rounded-lg p-6 pt-16"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              >
                {/* Header */}
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-6">Bolty Dashboard</div>

                {/* Cards Grid - 3x2 layout */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {/* Card 1: AI Agent */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border border-white/10 rounded p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-500 uppercase">AI Agent</span>
                    </div>
                    <div className="text-green-400 text-xs font-medium mb-4">Deploying</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Requests</div>
                        <div className="flex gap-1 h-8 items-end">
                          {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8].map((h, i) => (
                            <div key={i} className="flex-1 bg-purple-500/60 rounded" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 2: Marketplace */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border border-white/10 rounded p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-gray-500 uppercase">Marketplace</span>
                    </div>
                    <div className="text-green-400 text-xs font-medium mb-4 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Live
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Sales</div>
                        <div className="flex gap-1 h-8 items-end">
                          {[0.4, 0.45, 0.42, 0.48, 0.44, 0.5].map((h, i) => (
                            <div key={i} className="flex-1 bg-cyan-500/60 rounded" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 3: ETH Payments */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="border border-white/10 rounded p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-pink-400" />
                      <span className="text-xs text-gray-500 uppercase">ETH Payments</span>
                    </div>
                    <div className="text-green-400 text-xs font-medium mb-4 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Volume</div>
                        <div className="flex gap-1 h-8 items-end">
                          {[0.5, 0.55, 0.52, 0.58, 0.54, 0.6].map((h, i) => (
                            <div key={i} className="flex-1 bg-pink-500/60 rounded" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 4: Repos */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="border border-white/10 rounded p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-500 uppercase">Repos</span>
                    </div>
                    <div className="text-green-400 text-xs font-medium mb-4">24 synced</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Commits</div>
                        <div className="flex gap-1 h-8 items-end">
                          {[0.4, 0.5, 0.45, 0.55, 0.48, 0.6].map((h, i) => (
                            <div key={i} className="flex-1 bg-purple-500/60 rounded" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 5: Users */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="border border-white/10 rounded p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-gray-500 uppercase">Users</span>
                    </div>
                    <div className="text-green-400 text-xs font-medium mb-4">1.2k</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Growth</div>
                        <div className="flex gap-1 h-8 items-end">
                          {[0.35, 0.48, 0.44, 0.52, 0.46, 0.55].map((h, i) => (
                            <div key={i} className="flex-1 bg-cyan-500/60 rounded" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 6: Uptime */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="border border-white/10 rounded p-4"
                    style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-500 uppercase">Uptime</span>
                    </div>
                    <div className="text-green-400 text-xs font-medium mb-4">99.9%</div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status</div>
                        <div className="flex gap-1 h-8 items-end">
                          {[0.55, 0.58, 0.56, 0.6, 0.58, 0.62].map((h, i) => (
                            <div key={i} className="flex-1 bg-green-500/60 rounded" style={{ height: `${h * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
