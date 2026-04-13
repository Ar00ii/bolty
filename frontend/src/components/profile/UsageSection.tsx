'use client';

import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';

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

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-light text-white">Usage & Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Monitor your API usage and activity</p>
      </div>

      {/* Main Usage Metric */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">API Calls This Month</p>
            <p className="text-2xl font-light text-white mt-1">
              {data.totalCalls.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              of {data.maxCalls.toLocaleString()} included
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-light text-purple-400">
              {Math.round(usagePercent)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isError
                  ? 'bg-red-500'
                  : isWarning
                    ? 'bg-yellow-500'
                    : 'bg-purple-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          {(isWarning || isError) && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">
                {isError ? 'You have reached 95% of your usage limit' : 'You are approaching your usage limit'}
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Reset on {new Date(data.lastResetDate).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Agents */}
        <div className="p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active Agents</p>
          <p className="text-3xl font-light text-white">{data.activeAgents}</p>
          <p className="text-xs text-gray-400 mt-2">Currently deployed</p>
        </div>

        {/* Last 24h */}
        <div className="p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Last 24h</p>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-light text-white">
            {data.last24hCalls.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-2">API calls</p>
        </div>
      </div>

      {/* Upgrade Section */}
      {usagePercent > 80 && (
        <div className="p-4 border-2 border-purple-500/30 bg-purple-900/10 rounded-lg">
          <p className="text-sm text-purple-200 font-light mb-2">Need more capacity?</p>
          <p className="text-xs text-purple-300 mb-3">
            Upgrade to a higher plan to increase your API call limits
          </p>
          <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-light transition-colors">
            View Plans
          </button>
        </div>
      )}
    </div>
  );
};

UsageSection.displayName = 'UsageSection';
