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

  // Auto-start animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDeploying(true);
      // Show dashboard after arrow animation completes (1.5s)
      const dashboardTimer = setTimeout(() => {
        setShowDashboard(true);
        // Stop deploying animation after all boxes have loaded
        setTimeout(() => {
          setIsDeploying(false);
        }, 3000);
      }, 1500);
      return () => clearTimeout(dashboardTimer);
    }, 1000); // Start after 1 second

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen pt-32 pb-20 px-4 overflow-hidden">
      {/* Gradient background: black to purple */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a0033 50%, #0a0015 100%)',
        }}
      />

      {/* Grid overlay - sutil */}
      <div className="absolute inset-0 pointer-events-none">
        <svg width="100%" height="100%" className="absolute">
          <defs>
            <pattern
              id="render-grid"
              x="0"
              y="0"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#render-grid)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT: Text & Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-6xl md:text-7xl lg:text-7xl font-bold leading-tight text-white mb-4">
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

        {/* RIGHT: Dashboard Visual */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Deploy Button with Arrow */}
          <div className="absolute -top-20 right-4 flex flex-col items-center">
            {/* Arrow SVG - L shaped */}
            <svg
              width="60"
              height="120"
              viewBox="0 0 60 120"
              className="absolute top-16"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="arrowGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              {/* Vertical line */}
              <motion.line
                x1="30"
                y1="0"
                x2="30"
                y2="80"
                stroke="url(#arrowGradient)"
                strokeWidth="3"
                initial={{ strokeDasharray: 80, strokeDashoffset: 80 }}
                animate={isDeploying ? { strokeDashoffset: 0 } : { strokeDashoffset: 80 }}
                transition={{ duration: 1 }}
              />
              {/* Horizontal line */}
              <motion.line
                x1="30"
                y1="80"
                x2="0"
                y2="80"
                stroke="url(#arrowGradient)"
                strokeWidth="3"
                initial={{ strokeDasharray: 30, strokeDashoffset: 30 }}
                animate={isDeploying ? { strokeDashoffset: 0 } : { strokeDashoffset: 30 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              />
              {/* Arrow head */}
              <motion.polygon
                points="0,80 8,76 8,84"
                fill="#ec4899"
                initial={{ opacity: 0 }}
                animate={isDeploying ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 }}
              />
            </svg>

            {/* Deploy Button (non-interactive) */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="px-6 py-2 rounded font-mono text-sm font-medium bg-gray-200 text-black cursor-default"
            >
              deploy
            </motion.div>
          </div>

          {/* Dashboard container - only shows after arrow animation */}
          {showDashboard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-lg border border-white/20 p-6 transition-all"
            style={{
              background: isDeploying
                ? 'rgba(168, 85, 247, 0.15)'
                : 'rgba(0, 0, 0, 0.4)',
              borderColor: isDeploying
                ? 'rgba(168, 85, 247, 0.4)'
                : 'rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest text-gray-500">Production</div>
            </div>

            {/* Grid of service cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Card 1: AI Agent Deploy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isDeploying ? [1, 1.02, 1] : 1,
                  boxShadow: isDeploying
                    ? [
                        '0 0 0px rgba(168, 85, 247, 0)',
                        '0 0 20px rgba(168, 85, 247, 0.5)',
                        '0 0 0px rgba(168, 85, 247, 0)',
                      ]
                    : '0 0 0px rgba(168, 85, 247, 0)',
                }}
                transition={{
                  delay: 0.2,
                  scale: isDeploying ? { duration: 0.5, repeat: Infinity } : { duration: 0.3 },
                  boxShadow: isDeploying ? { duration: 0.8, repeat: Infinity } : { duration: 0.3 },
                }}
                className="border border-white/10 rounded p-4"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500 uppercase">AI Agent</span>
                </div>
                <div className="text-green-400 text-sm font-medium">Deploying</div>
                <div className="mt-4 h-12 flex items-end gap-1">
                  {[0.3, 0.5, 0.4, 0.7, 0.6, 0.8].map((h, i) => (
                    <div key={i} className="flex-1 bg-purple-500/50 rounded" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                  <div>Memory</div>
                  <div>CPU</div>
                </div>
              </motion.div>

              {/* Card 2: ETH Payments */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isDeploying ? [1, 1.02, 1] : 1,
                  boxShadow: isDeploying
                    ? [
                        '0 0 0px rgba(6, 182, 212, 0)',
                        '0 0 20px rgba(6, 182, 212, 0.5)',
                        '0 0 0px rgba(6, 182, 212, 0)',
                      ]
                    : '0 0 0px rgba(6, 182, 212, 0)',
                }}
                transition={{
                  delay: 0.4,
                  scale: isDeploying ? { duration: 0.6, repeat: Infinity } : { duration: 0.3 },
                  boxShadow: isDeploying ? { duration: 0.9, repeat: Infinity } : { duration: 0.3 },
                }}
                className="border border-white/10 rounded p-4"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500 uppercase">ETH Pay</span>
                </div>
                <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Available
                </div>
                <div className="mt-4 h-12 flex items-end gap-1">
                  {[0.4, 0.45, 0.42, 0.48, 0.44, 0.5].map((h, i) => (
                    <div key={i} className="flex-1 bg-cyan-500/50 rounded" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                  <div>Network</div>
                  <div>Tx/s</div>
                </div>
              </motion.div>

              {/* Card 3: Database */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isDeploying ? [1, 1.02, 1] : 1,
                  boxShadow: isDeploying
                    ? [
                        '0 0 0px rgba(236, 72, 153, 0)',
                        '0 0 20px rgba(236, 72, 153, 0.5)',
                        '0 0 0px rgba(236, 72, 153, 0)',
                      ]
                    : '0 0 0px rgba(236, 72, 153, 0)',
                }}
                transition={{
                  delay: 0.6,
                  scale: isDeploying ? { duration: 0.7, repeat: Infinity } : { duration: 0.3 },
                  boxShadow: isDeploying ? { duration: 1, repeat: Infinity } : { duration: 0.3 },
                }}
                className="border border-white/10 rounded p-4"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500 uppercase">Database</span>
                </div>
                <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Available
                </div>
                <div className="mt-4 h-12 flex items-end gap-1">
                  {[0.5, 0.55, 0.52, 0.58, 0.54, 0.6].map((h, i) => (
                    <div key={i} className="flex-1 bg-magenta-500/50 rounded" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                  <div>Storage</div>
                  <div>Conn</div>
                </div>
              </motion.div>

              {/* Card 4: Cache */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: isDeploying ? [1, 1.02, 1] : 1,
                  boxShadow: isDeploying
                    ? [
                        '0 0 0px rgba(34, 197, 94, 0)',
                        '0 0 20px rgba(34, 197, 94, 0.5)',
                        '0 0 0px rgba(34, 197, 94, 0)',
                      ]
                    : '0 0 0px rgba(34, 197, 94, 0)',
                }}
                transition={{
                  delay: 0.8,
                  scale: isDeploying ? { duration: 0.8, repeat: Infinity } : { duration: 0.3 },
                  boxShadow: isDeploying ? { duration: 1.1, repeat: Infinity } : { duration: 0.3 },
                }}
                className="border border-white/10 rounded p-4"
                style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-500 uppercase">Cache</span>
                </div>
                <div className="text-green-400 text-sm font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Available
                </div>
                <div className="mt-4 h-12 flex items-end gap-1">
                  {[0.6, 0.62, 0.64, 0.66, 0.68, 0.65].map((h, i) => (
                    <div key={i} className="flex-1 bg-green-500/50 rounded" style={{ height: `${h * 100}%` }} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                  <div>Hits</div>
                  <div>Ms</div>
                </div>
              </motion.div>
            </div>

            {/* Bottom row: Wide cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="border border-white/10 rounded p-4"
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
  );
}
