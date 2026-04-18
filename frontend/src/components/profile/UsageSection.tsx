'use client';

import { TrendingUp, AlertCircle, Users } from 'lucide-react';
import React from 'react';

interface UsageData {
  totalCalls: number;
  maxCalls: number;
  activeAgents: number;
  last24hCalls: number;
  lastResetDate: string;
}

interface UsageSectionProps {
  data: UsageData;
}

export const UsageSection: React.FC<UsageSectionProps> = ({ data }) => {
  const usagePercent = (data.totalCalls / data.maxCalls) * 100;
  const isWarning = usagePercent > 80;
  const isError = usagePercent > 95;

  const progressColor = isError ? '#ef4444' : isWarning ? '#f59e0b' : '#836EF9';
  const progressGlow = isError
    ? 'rgba(239,68,68,0.55)'
    : isWarning
      ? 'rgba(245,158,11,0.55)'
      : 'rgba(131,110,249,0.55)';

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-light text-white">Usage & Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Monitor your API usage and activity</p>
      </div>

      {/* Main Usage Metric */}
      <div
        className="relative p-6 rounded-xl overflow-hidden space-y-4"
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
          }}
        />
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
              API Calls This Month
            </p>
            <p className="text-3xl font-light text-white tabular-nums tracking-[-0.01em]">
              {data.totalCalls.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-500 mt-1 tabular-nums">
              of {data.maxCalls.toLocaleString()} included
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-4xl font-light tabular-nums tracking-[-0.02em]"
              style={{
                color: progressColor,
                textShadow: `0 0 14px ${progressGlow}`,
              }}
            >
              {Math.round(usagePercent)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="relative w-full h-2 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(usagePercent, 100)}%`,
              background: `linear-gradient(90deg, ${progressColor}cc 0%, ${progressColor} 100%)`,
              boxShadow: `0 0 12px -2px ${progressGlow}`,
            }}
          />
        </div>

        {(isWarning || isError) && (
          <div
            className="relative flex items-center gap-2 p-3 rounded-lg overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.3)',
            }}
          >
            <AlertCircle className="w-4 h-4 text-[#fda4af] flex-shrink-0" />
            <p className="text-[13px] text-[#fda4af] tracking-[0.005em]">
              {isError
                ? 'You have reached 95% of your usage limit'
                : 'You are approaching your usage limit'}
            </p>
          </div>
        )}

        <p className="text-xs text-zinc-500">
          Resets on{' '}
          <span className="text-zinc-400 tabular-nums">
            {new Date(data.lastResetDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Agents */}
        <div
          className="relative p-4 rounded-xl overflow-hidden transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.4) 50%, transparent 100%)',
            }}
          />
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Active Agents
            </p>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(6,182,212,0.22) 0%, rgba(6,182,212,0.06) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(6,182,212,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(6,182,212,0.45)',
              }}
            >
              <Users className="w-3.5 h-3.5 text-[#67e8f9]" />
            </div>
          </div>
          <p className="text-3xl font-light text-white tabular-nums tracking-[-0.01em]">
            {data.activeAgents}
          </p>
          <p className="text-xs text-zinc-500 mt-2">Currently deployed</p>
        </div>

        {/* Last 24h */}
        <div
          className="relative p-4 rounded-xl overflow-hidden transition-all hover:brightness-110"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.4) 50%, transparent 100%)',
            }}
          />
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
              Last 24h
            </p>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
              }}
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#b4a7ff]" />
            </div>
          </div>
          <p className="text-3xl font-light text-white tabular-nums tracking-[-0.01em]">
            {data.last24hCalls.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-2">API calls</p>
        </div>
      </div>

      {/* Upgrade Section */}
      {usagePercent > 80 && (
        <div
          className="relative p-5 rounded-xl overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(131,110,249,0.12) 0%, rgba(131,110,249,0.02) 100%)',
            boxShadow:
              'inset 0 0 0 1px rgba(131,110,249,0.32), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 28px -8px rgba(131,110,249,0.35)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.55) 50%, transparent 100%)',
            }}
          />
          <p className="text-[15px] font-light text-white mb-1 tracking-[-0.005em]">
            Need more capacity?
          </p>
          <p className="text-[13px] text-zinc-400 mb-4 tracking-[0.005em]">
            Upgrade to a higher plan to increase your API call limits
          </p>
          <button
            className="w-full px-4 py-2.5 text-white rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            View Plans
          </button>
        </div>
      )}
    </div>
  );
};

UsageSection.displayName = 'UsageSection';
