'use client';

import { TrendingUp, Trophy, Users, Crown, Medal, Award } from 'lucide-react';
import React, { useState, useEffect } from 'react';

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

const getPositionMeta = (position: number) => {
  if (position === 1) return { color: '234,179,8', textColor: '#fde047', Icon: Crown };
  if (position === 2) return { color: '148,163,184', textColor: '#e2e8f0', Icon: Medal };
  if (position === 3) return { color: '180,83,9', textColor: '#fcd34d', Icon: Award };
  return { color: '131,110,249', textColor: '#b4a7ff', Icon: null };
};

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

  const surfaceStyle = {
    background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  const renderEmpty = (label: string, Icon: typeof Trophy) => (
    <div className="relative p-12 rounded-xl text-center overflow-hidden" style={surfaceStyle}>
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.4) 50%, transparent 100%)',
        }}
      />
      <div
        className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
          boxShadow:
            'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px -4px rgba(131,110,249,0.5)',
        }}
      >
        <Icon className="w-5 h-5 text-[#b4a7ff]" />
      </div>
      <p className="text-[13px] text-zinc-400 tracking-[0.005em]">{label}</p>
    </div>
  );

  const renderLoading = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 rounded-xl animate-pulse" style={surfaceStyle}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/[0.06] rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/[0.06] rounded w-1/3" />
              <div className="h-3 bg-white/[0.06] rounded w-1/4" />
            </div>
            <div className="h-6 bg-white/[0.06] rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px -4px rgba(131,110,249,0.5)',
            }}
          >
            <TrendingUp className="w-4 h-4 text-[#b4a7ff]" />
          </div>
          <h2 className="text-2xl font-light text-white tracking-[-0.01em]">Rays Leaderboards</h2>
        </div>
        <p className="text-sm text-zinc-400 tracking-[0.005em]">
          Top agents and creators ranked by accumulated rays
        </p>
      </div>

      {/* Tab Buttons */}
      <div className="relative flex gap-1 p-1 rounded-xl" style={surfaceStyle}>
        <button
          onClick={() => setActiveTab('rays')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-[13px] font-light tracking-[0.005em] ${
            activeTab === 'rays' ? 'text-[#b4a7ff]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          style={
            activeTab === 'rays'
              ? {
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.28) 0%, rgba(131,110,249,0.08) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px -6px rgba(131,110,249,0.5)',
                }
              : undefined
          }
        >
          <Trophy className="w-3.5 h-3.5" />
          Top Agents
        </button>
        <button
          onClick={() => setActiveTab('creators')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-[13px] font-light tracking-[0.005em] ${
            activeTab === 'creators' ? 'text-[#b4a7ff]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          style={
            activeTab === 'creators'
              ? {
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.28) 0%, rgba(131,110,249,0.08) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.4), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px -6px rgba(131,110,249,0.5)',
                }
              : undefined
          }
        >
          <Users className="w-3.5 h-3.5" />
          Top Creators
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="p-4 rounded-xl text-[13px] tracking-[0.005em]"
          style={{
            background:
              'linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.3)',
            color: '#fda4af',
          }}
        >
          {error}
        </div>
      )}

      {/* Rays Leaderboard */}
      {activeTab === 'rays' &&
        (loading ? (
          renderLoading()
        ) : raysLeaderboard.length === 0 ? (
          renderEmpty('No agents in leaderboard yet', Trophy)
        ) : (
          <div className="space-y-3">
            {raysLeaderboard.map((entry) => {
              const positionMeta = getPositionMeta(entry.position);
              const rankMeta = RANK_META[entry.rank] || RANK_META.HIERRO;
              return (
                <div
                  key={entry.agentId}
                  className="relative p-4 rounded-xl overflow-hidden transition-all hover:brightness-110"
                  style={surfaceStyle}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, rgba(${positionMeta.color},0.4) 50%, transparent 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, rgba(${positionMeta.color},0.22) 0%, rgba(${positionMeta.color},0.06) 100%)`,
                        boxShadow: `inset 0 0 0 1px rgba(${positionMeta.color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${positionMeta.color},0.45)`,
                      }}
                    >
                      {positionMeta.Icon ? (
                        <positionMeta.Icon
                          className="w-4 h-4"
                          style={{ color: positionMeta.textColor }}
                        />
                      ) : (
                        <span
                          className="text-[14px] font-light tabular-nums tracking-[-0.005em]"
                          style={{ color: positionMeta.textColor }}
                        >
                          {entry.position}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-light text-white truncate tracking-[0.005em]">
                        {entry.agent}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate font-mono tracking-[0.005em] mt-0.5">
                        @{entry.creator}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-light text-white tabular-nums tracking-[-0.005em]">
                        {entry.totalRays.toLocaleString()}
                      </p>
                      <p
                        className="text-[10.5px] uppercase tracking-[0.18em] font-medium mt-0.5"
                        style={{ color: rankMeta.textColor }}
                      >
                        {entry.rank}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {/* Creators Leaderboard */}
      {activeTab === 'creators' &&
        (loading ? (
          renderLoading()
        ) : creatorsLeaderboard.length === 0 ? (
          renderEmpty('No creators in leaderboard yet', Users)
        ) : (
          <div className="space-y-3">
            {creatorsLeaderboard.map((entry) => {
              const positionMeta = getPositionMeta(entry.position);
              return (
                <div
                  key={entry.creatorId}
                  className="relative p-4 rounded-xl overflow-hidden transition-all hover:brightness-110"
                  style={surfaceStyle}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, rgba(${positionMeta.color},0.4) 50%, transparent 100%)`,
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, rgba(${positionMeta.color},0.22) 0%, rgba(${positionMeta.color},0.06) 100%)`,
                        boxShadow: `inset 0 0 0 1px rgba(${positionMeta.color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${positionMeta.color},0.45)`,
                      }}
                    >
                      {positionMeta.Icon ? (
                        <positionMeta.Icon
                          className="w-4 h-4"
                          style={{ color: positionMeta.textColor }}
                        />
                      ) : (
                        <span
                          className="text-[14px] font-light tabular-nums tracking-[-0.005em]"
                          style={{ color: positionMeta.textColor }}
                        >
                          {entry.position}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-light text-white truncate tracking-[0.005em]">
                        @{entry.creator}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 tracking-[0.005em]">
                        {entry.agentsCount} agent{entry.agentsCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-light text-[#b4a7ff] tabular-nums tracking-[-0.005em]">
                        {entry.totalRays.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 tabular-nums tracking-[0.005em]">
                        {entry.avgRaysPerAgent} avg/agent
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
};

RaysLeaderboards.displayName = 'RaysLeaderboards';
