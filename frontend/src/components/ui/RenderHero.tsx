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
      <div className="relative z-10 max-w-7xl mx-auto">
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

          {/* RIGHT: Deploy + Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex flex-col items-center"
          >
            {/* Deploy Button */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="px-8 py-3 rounded-lg font-mono text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors mb-8"
            >
              deploy
            </motion.button>

            {/* Arrow - Simple and clear */}
            <svg width="80" height="120" viewBox="0 0 80 120" className="mb-4">
              {/* Vertical line */}
              <motion.line
                x1="40"
                y1="10"
                x2="40"
                y2="90"
                stroke="#a855f7"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={isDeploying ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 1.2 }}
              />
              {/* Horizontal line */}
              <motion.line
                x1="40"
                y1="90"
                x2="10"
                y2="90"
                stroke="#a855f7"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={isDeploying ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              />
              {/* Arrow head */}
              <motion.polygon
                points="10,90 15,85 15,95"
                fill="#a855f7"
                initial={{ opacity: 0 }}
                animate={isDeploying ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.5 }}
              />
            </svg>

            {/* Dashboard - appears after arrow */}
            {showDashboard && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full rounded-lg border border-white/20 p-6"
                style={{ background: 'rgba(0, 0, 0, 0.6)' }}
              >
                <div className="text-xs uppercase tracking-widest text-gray-500 mb-6">Production Dashboard</div>

                {/* Cards Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Card 1 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="border border-white/10 rounded-lg p-4"
                    style={{ background: 'rgba(168, 85, 247, 0.1)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-gray-500 uppercase">AI Agent</span>
                    </div>
                    <div className="text-sm text-green-400 font-medium mb-3">Deploying</div>
                    <div className="flex gap-1 h-10 items-end">
                      {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8].map((h, i) => (
                        <div key={i} className="flex-1 bg-purple-500/60 rounded" style={{ height: `${h * 100}%` }} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Card 2 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="border border-white/10 rounded-lg p-4"
                    style={{ background: 'rgba(6, 182, 212, 0.1)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs text-gray-500 uppercase">ETH Pay</span>
                    </div>
                    <div className="text-sm text-green-400 font-medium mb-3 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Available
                    </div>
                    <div className="flex gap-1 h-10 items-end">
                      {[0.4, 0.45, 0.42, 0.48, 0.44, 0.5].map((h, i) => (
                        <div key={i} className="flex-1 bg-cyan-500/60 rounded" style={{ height: `${h * 100}%` }} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Card 3 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="border border-white/10 rounded-lg p-4"
                    style={{ background: 'rgba(236, 72, 153, 0.1)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-pink-400" />
                      <span className="text-xs text-gray-500 uppercase">Database</span>
                    </div>
                    <div className="text-sm text-green-400 font-medium mb-3 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Available
                    </div>
                    <div className="flex gap-1 h-10 items-end">
                      {[0.5, 0.55, 0.52, 0.58, 0.54, 0.6].map((h, i) => (
                        <div key={i} className="flex-1 bg-pink-500/60 rounded" style={{ height: `${h * 100}%` }} />
                      ))}
                    </div>
                  </motion.div>

                  {/* Card 4 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="border border-white/10 rounded-lg p-4"
                    style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-gray-500 uppercase">Cache</span>
                    </div>
                    <div className="text-sm text-green-400 font-medium mb-3 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Available
                    </div>
                    <div className="flex gap-1 h-10 items-end">
                      {[0.6, 0.62, 0.64, 0.66, 0.68, 0.65].map((h, i) => (
                        <div key={i} className="flex-1 bg-green-500/60 rounded" style={{ height: `${h * 100}%` }} />
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="border border-white/10 rounded-lg p-4"
                  style={{ background: 'rgba(0, 0, 0, 0.5)' }}
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
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
