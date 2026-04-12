'use client';

import React from 'react';
import type { Agent } from '@/hooks/useAgentManagement';

interface AgentMetricsDisplayProps {
  metrics: Agent['metrics'] | null;
  loading?: boolean;
}

export const AgentMetricsDisplay: React.FC<AgentMetricsDisplayProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="h-4 bg-gray-700 rounded w-24 mb-2 animate-pulse" />
            <div className="h-6 bg-gray-700 rounded w-12 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 rounded-lg bg-gray-800/20 border border-gray-700 text-center">
        <p className="text-sm text-gray-400">No metrics available</p>
      </div>
    );
  }

  const successRate = metrics.totalCalls > 0
    ? Math.round((metrics.successfulCalls / metrics.totalCalls) * 100)
    : 0;

  const metrics_items = [
    {
      label: 'Total Calls',
      value: metrics.totalCalls.toLocaleString(),
      color: 'text-blue-400',
    },
    {
      label: 'Successful',
      value: metrics.successfulCalls.toLocaleString(),
      color: 'text-emerald-400',
    },
    {
      label: 'Failed',
      value: metrics.failedCalls.toLocaleString(),
      color: 'text-red-400',
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.avgResponseTime}ms`,
      color: 'text-purple-400',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      color: 'text-yellow-400',
    },
    {
      label: 'Last Call',
      value: metrics.lastCallAt ? new Date(metrics.lastCallAt).toLocaleDateString() : 'Never',
      color: 'text-gray-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {metrics_items.map((item) => (
        <div
          key={item.label}
          className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
            {item.label}
          </p>
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
};

AgentMetricsDisplay.displayName = 'AgentMetricsDisplay';
