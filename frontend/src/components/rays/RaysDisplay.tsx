'use client';

import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp } from 'lucide-react';

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

const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HIERRO: { bg: 'bg-gray-800', text: 'text-gray-400', border: 'border-gray-700' },
  BRONCE: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-600' },
  PLATA: { bg: 'bg-slate-600/30', text: 'text-slate-300', border: 'border-slate-500' },
  ORO: { bg: 'bg-yellow-600/30', text: 'text-yellow-400', border: 'border-yellow-500' },
  PLATINO: { bg: 'bg-purple-600/30', text: 'text-purple-400', border: 'border-purple-500' },
  DIAMANTE: { bg: 'bg-cyan-600/30', text: 'text-cyan-400', border: 'border-cyan-500' },
  MAESTRIA: { bg: 'bg-blue-600/30', text: 'text-blue-400', border: 'border-blue-500' },
  CAMPEON: { bg: 'bg-red-600/30', text: 'text-red-400', border: 'border-red-500' },
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

  if (loading) {
    return (
      <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700 animate-pulse">
        <div className="h-20 bg-gray-700 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
        <p className="text-gray-400 text-sm">{error || 'Unable to load rays data'}</p>
      </div>
    );
  }

  const rankColor = RANK_COLORS[data.currentRank] || RANK_COLORS.HIERRO;

  return (
    <div className="space-y-4">
      {/* Main Card */}
      <div className={`p-6 rounded-lg border-2 ${rankColor.bg} ${rankColor.border}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-light">
              Current Rank
            </p>
            <h3 className={`text-3xl font-light mt-1 ${rankColor.text}`}>
              {data.currentRank}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-light">
              Trending Position
            </p>
            <p className={`text-3xl font-light mt-1 ${rankColor.text}`}>
              #{data.position}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-400">Total Rays Accumulated</p>
            <p className="text-2xl font-light text-white mt-1">
              {data.totalRaysAccumulated}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Visibility Multiplier</p>
            <p className={`text-2xl font-light mt-1 ${rankColor.text}`}>
              {getBoostMultiplier(data.currentRank)}x
            </p>
          </div>
        </div>

        {data.lastRankUpAt && (
          <p className="text-xs text-gray-500 mt-4">
            Last rank up: {new Date(data.lastRankUpAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
        <div className="flex items-start gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-light text-white">Ranking Benefits</p>
        </div>
        <ul className="text-xs text-gray-400 space-y-1 ml-6">
          <li>Higher position in trending leaderboard</li>
          <li>Increased visibility and exposure</li>
          <li>More transaction opportunities</li>
          <li>Rays accumulated permanently</li>
        </ul>
      </div>

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

  const rankOrder = ['HIERRO', 'BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE', 'MAESTRIA', 'CAMPEON'];
  const currentIndex = rankOrder.indexOf(currentRank);
  const nextIndex = currentIndex + 1;

  if (nextIndex >= rankOrder.length) {
    return (
      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
        <p className="text-sm font-light text-purple-400">You are at the highest rank!</p>
      </div>
    );
  }

  const nextRank = rankOrder[nextIndex];
  const nextThreshold = rankThresholds[nextRank];
  const raysNeeded = nextThreshold - totalRays;

  return (
    <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 font-light">Next Rank: {nextRank}</p>
        <p className="text-xs text-gray-400">
          {totalRays} / {nextThreshold} rays
        </p>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${(totalRays / nextThreshold) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {raysNeeded > 0 ? `${raysNeeded} rays needed` : 'Ready to rank up!'}
      </p>
    </div>
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
