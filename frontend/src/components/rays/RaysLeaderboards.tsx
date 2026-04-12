'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

interface RaysLeaderboardEntry {
  position: number;
  agent: string;
  agentId: string;
  creator: string;
  totalRays: number;
  rank: string;
}

interface CreatorsLeaderboardEntry {
  position: number;
  creator: string;
  creatorId: string;
  agentsCount: number;
  totalRays: number;
  avgRaysPerAgent: number;
}

type TabType = 'rays' | 'creators';

export const RaysLeaderboards: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('rays');
  const [raysLeaderboard, setRaysLeaderboard] = useState<RaysLeaderboardEntry[]>([]);
  const [creatorsLeaderboard, setCreatorsLeaderboard] = useState<CreatorsLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === 'rays') {
          const response = await fetch(`${API_URL}/rays/leaderboard/rays`, {
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to fetch rays leaderboard');
          const data = await response.json();
          setRaysLeaderboard(data.leaderboard || []);
        } else {
          const response = await fetch(`${API_URL}/rays/leaderboard/creators`, {
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to fetch creators leaderboard');
          const data = await response.json();
          setCreatorsLeaderboard(data.leaderboard || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboards();
  }, [activeTab, API_URL]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Rays Leaderboards
        </h2>
        <p className="text-sm text-gray-400 mt-1">Top agents and creators ranked by accumulated rays</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('rays')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'rays'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Top Agents by Rays
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'creators'
              ? 'text-purple-400 border-b-2 border-purple-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Top Creators
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Rays Leaderboard */}
      {activeTab === 'rays' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading leaderboard...</div>
          ) : raysLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No agents in leaderboard yet</div>
          ) : (
            raysLeaderboard.map((entry) => (
              <div
                key={entry.agentId}
                className="p-4 rounded-lg bg-gray-800/30 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-purple-400 w-10 text-center">
                      #{entry.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{entry.agent}</p>
                      <p className="text-xs text-gray-400">@{entry.creator}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{entry.totalRays}</p>
                    <p className="text-xs text-gray-400">{entry.rank}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Creators Leaderboard */}
      {activeTab === 'creators' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : creatorsLeaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No creators in leaderboard yet</div>
          ) : (
            creatorsLeaderboard.map((entry) => (
              <div
                key={entry.creatorId}
                className="p-4 rounded-lg bg-gray-800/30 border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-2xl font-bold text-purple-400 w-10 text-center">
                      #{entry.position}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white">@{entry.creator}</p>
                      <p className="text-xs text-gray-400">
                        {entry.agentsCount} agent{entry.agentsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">
                      Avg: <span className="text-white font-semibold">{entry.avgRaysPerAgent}</span> rays
                    </p>
                    <p className="text-lg font-bold text-purple-400">{entry.totalRays}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

RaysLeaderboards.displayName = 'RaysLeaderboards';
