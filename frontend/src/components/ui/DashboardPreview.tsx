'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  status?: 'available' | 'inactive';
  chart?: { points: number[] };
}

function MetricCard({ label, value, status, chart }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 p-4 rounded-lg border border-white/10 bg-black/20 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/50">{label}</span>
        {status === 'available' && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
          />
        )}
      </div>
      <div className="text-lg font-light text-white">{value}</div>

      {chart && (
        <svg viewBox="0 0 100 30" className="w-full h-12 mt-2">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.01)" />
            </linearGradient>
          </defs>
          <polyline
            points={chart.points
              .map((v, i) => `${(i / (chart.points.length - 1)) * 100},${30 - v * 30}`)
              .join(' ')}
            fill="none"
            stroke="rgb(147, 51, 234)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          <polygon
            points={`0,30 ${chart.points
              .map((v, i) => `${(i / (chart.points.length - 1)) * 100},${30 - v * 30}`)
              .join(' ')} 100,30`}
            fill="url(#gradient)"
          />
        </svg>
      )}
    </motion.div>
  );
}

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="space-y-4"
    >
      {/* Top section */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="app-backend"
          value="Available"
          status="available"
          chart={{ points: [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.7] }}
        />
        <MetricCard
          label="Memory"
          value="42%"
          chart={{ points: [0.4, 0.45, 0.42, 0.48, 0.44, 0.46, 0.42] }}
        />
        <MetricCard
          label="CPU"
          value="28%"
          chart={{ points: [0.25, 0.28, 0.26, 0.32, 0.28, 0.3, 0.28] }}
        />
      </div>

      {/* Bottom section - 2 cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="app-database"
          value="Available"
          status="available"
          chart={{ points: [0.5, 0.55, 0.52, 0.58, 0.54, 0.6, 0.56] }}
        />
        <MetricCard
          label="Storage"
          value="1.2TB / 2TB"
          chart={{ points: [0.6, 0.62, 0.64, 0.66, 0.68, 0.7, 0.72] }}
        />
      </div>
    </motion.div>
  );
}
