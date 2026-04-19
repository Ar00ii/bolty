'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Trophy, Gauge, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AgentRaysData {
  agentId: string;
  totalRaysAccumulated: number;
  currentRank: string;
  position: number;
  lastRankUpAt?: string;
}

interface RaysDisplayProps {
  agentId: string;
  onDataLoaded?: (data: AgentRaysData) => void;
  refreshTrigger?: number;
}

const RANK_META: Record<string, { color: string; textColor: string }> = {
  HIERRO: { color: '161,161,170', textColor: '#d4d4d8' },
  BRONCE: { color: '180,83,9', textColor: '#fcd34d' },
  PLATA: { color: '148,163,184', textColor: '#e2e8f0' },
  ORO: { color: '234,179,8', textColor: '#fde047' },
  PLATINO: { color: '131,110,249', textColor: '#b4a7ff' },
  DIAMANTE: { color: '6,182,212', textColor: '#67e8f9' },
  MAESTRIA: { color: '59,130,246', textColor: '#93c5fd' },
  CAMPEON: { color: '239,68,68', textColor: '#fda4af' },
};

export const RaysDisplay: React.FC<RaysDisplayProps> = ({
  agentId,
  onDataLoaded,
  refreshTrigger,
}) => {
  const [data, setData] = useState<AgentRaysData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    const fetchRaysData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/rays/agent/${agentId}`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch rays data');
        const result = await response.json();
        setData(result.agentRays);
        onDataLoaded?.(result.agentRays);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rays');
      } finally {
        setLoading(false);
      }
    };

    fetchRaysData();
  }, [agentId, API_URL, refreshTrigger, onDataLoaded]);

  const surfaceStyle = {
    background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl animate-pulse" style={surfaceStyle}>
        <div className="h-20 bg-white/[0.06] rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl text-center" style={surfaceStyle}>
        <p className="text-[13px] text-zinc-400 tracking-[0.005em]">
          {error || 'Unable to load rays data'}
        </p>
      </div>
    );
  }

  const rankMeta = RANK_META[data.currentRank] || RANK_META.HIERRO;

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative p-6 rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(180deg, rgba(${rankMeta.color},0.14) 0%, rgba(${rankMeta.color},0.04) 100%)`,
          boxShadow: `0 0 0 1px rgba(${rankMeta.color},0.3), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 40px -12px rgba(${rankMeta.color},0.35)`,
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(${rankMeta.color},0.6) 50%, transparent 100%)`,
          }}
        />
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, rgba(${rankMeta.color},0.28) 0%, rgba(${rankMeta.color},0.08) 100%)`,
                boxShadow: `inset 0 0 0 1px rgba(${rankMeta.color},0.45), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px -4px rgba(${rankMeta.color},0.55)`,
              }}
            >
              <Trophy className="w-4 h-4" style={{ color: rankMeta.textColor }} />
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                Current Rank
              </p>
              <h3
                className="text-3xl font-light mt-1 tracking-[-0.01em]"
                style={{
                  color: rankMeta.textColor,
                  textShadow: `0 0 24px rgba(${rankMeta.color},0.4)`,
                }}
              >
                {data.currentRank}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Trending Position
            </p>
            <p
              className="text-3xl font-light mt-1 tabular-nums tracking-[-0.01em]"
              style={{ color: rankMeta.textColor }}
            >
              #{data.position}
            </p>
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-4 pt-5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Total Rays
            </p>
            <p className="text-2xl font-light text-white mt-1 tabular-nums tracking-[-0.01em]">
              {data.totalRaysAccumulated.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Visibility Multiplier
            </p>
            <p
              className="text-2xl font-light mt-1 tabular-nums tracking-[-0.01em]"
              style={{ color: rankMeta.textColor }}
            >
              {getBoostMultiplier(data.currentRank)}x
            </p>
          </div>
        </div>

        {data.lastRankUpAt && (
          <p className="text-[11px] text-zinc-500 mt-4 tracking-[0.005em]">
            Last rank up: {new Date(data.lastRankUpAt).toLocaleDateString()}
          </p>
        )}
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative p-5 rounded-xl overflow-hidden"
        style={surfaceStyle}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.4) 50%, transparent 100%)',
          }}
        />
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
            }}
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#b4a7ff]" />
          </div>
          <p className="text-[14px] font-light text-white tracking-[0.005em]">Ranking Benefits</p>
        </div>
        <ul className="space-y-2 pl-11">
          {[
            'Higher position in trending leaderboard',
            'Increased visibility and exposure',
            'More transaction opportunities',
            'Rays accumulated permanently',
          ].map((benefit, idx) => (
            <motion.li
              key={benefit}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.12 + idx * 0.05,
                duration: 0.24,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="text-[13px] text-zinc-400 flex items-start gap-2 tracking-[0.005em]"
            >
              <Sparkles className="w-3 h-3 text-[#b4a7ff] mt-1 flex-shrink-0" />
              {benefit}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Progress to Next Rank */}
      <RankProgress currentRank={data.currentRank} totalRays={data.totalRaysAccumulated} />
    </div>
  );
};

interface RankProgressProps {
  currentRank: string;
  totalRays: number;
}

const RankProgress: React.FC<RankProgressProps> = ({ currentRank, totalRays }) => {
  const rankThresholds: Record<string, number> = {
    HIERRO: 0,
    BRONCE: 25,
    PLATA: 50,
    ORO: 120,
    PLATINO: 250,
    DIAMANTE: 500,
    MAESTRIA: 1000,
    CAMPEON: 2000,
  };

  const rankOrder = [
    'HIERRO',
    'BRONCE',
    'PLATA',
    'ORO',
    'PLATINO',
    'DIAMANTE',
    'MAESTRIA',
    'CAMPEON',
  ];
  const currentIndex = rankOrder.indexOf(currentRank);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= rankOrder.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative p-5 rounded-xl text-center overflow-hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
          boxShadow:
            '0 0 0 1px rgba(131,110,249,0.35), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 30px -10px rgba(131,110,249,0.4)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.6) 50%, transparent 100%)',
          }}
        />
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-[#b4a7ff]" />
          <p className="text-[14px] font-light text-[#b4a7ff] tracking-[0.005em]">
            You are at the highest rank
          </p>
        </div>
      </motion.div>
    );
  }

  const nextRank = rankOrder[nextIndex];
  const nextThreshold = rankThresholds[nextRank];
  const raysNeeded = nextThreshold - totalRays;
  const progress = Math.min(100, (totalRays / nextThreshold) * 100);
  const nextMeta = RANK_META[nextRank] || RANK_META.HIERRO;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.16, duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative p-5 rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${nextMeta.color},0.4) 50%, transparent 100%)`,
        }}
      />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-zinc-500" />
          <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
            Next Rank
          </p>
          <span
            className="text-[12px] font-light tracking-[0.005em]"
            style={{ color: nextMeta.textColor }}
          >
            {nextRank}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 tabular-nums tracking-[0.005em]">
          {totalRays.toLocaleString()} / {nextThreshold.toLocaleString()}
        </p>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{
          background: 'rgba(8,8,12,0.6)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, rgba(${nextMeta.color},0.85) 0%, rgba(${nextMeta.color},1) 100%)`,
            boxShadow: `0 0 12px rgba(${nextMeta.color},0.6)`,
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-zinc-500 tracking-[0.005em]">
          {raysNeeded > 0 ? `${raysNeeded.toLocaleString()} rays needed` : 'Ready to rank up'}
        </p>
        <span className="text-[11px] font-light tabular-nums" style={{ color: nextMeta.textColor }}>
          {progress.toFixed(1)}%
        </span>
      </div>
    </motion.div>
  );
};

function getBoostMultiplier(rank: string): number {
  const multipliers: Record<string, number> = {
    HIERRO: 1,
    BRONCE: 2.5,
    PLATA: 5,
    ORO: 6,
    PLATINO: 10,
    DIAMANTE: 15,
    MAESTRIA: 20,
    CAMPEON: 25,
  };
  return multipliers[rank] || 1;
}

RaysDisplay.displayName = 'RaysDisplay';
