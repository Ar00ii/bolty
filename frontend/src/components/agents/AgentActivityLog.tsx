'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import type { AgentActivityLogEntry } from '@/hooks/useAgentManagement';

interface AgentActivityLogProps {
  activities: AgentActivityLogEntry[];
  loading?: boolean;
}

export const AgentActivityLog: React.FC<AgentActivityLogProps> = ({ activities, loading }) => {
  const getStatusColor = (status: AgentActivityLogEntry['status']) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'FAILED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'TIMEOUT':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: AgentActivityLogEntry['status']) => {
    switch (status) {
      case 'SUCCESS':
        return '✓';
      case 'FAILED':
        return '✕';
      case 'PENDING':
        return '⧖';
      case 'TIMEOUT':
        return '⏱';
      default:
        return '◯';
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-gray-800/20 border border-gray-700 text-center">
        <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-start gap-3">
            {/* Status Badge */}
            <div className={`px-2 py-1 rounded border text-xs font-medium flex-shrink-0 mt-0.5 ${getStatusColor(activity.status)}`}>
              {getStatusIcon(activity.status)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{activity.action}</p>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatTime(activity.createdAt)}
                </span>
              </div>

              {/* Response Time */}
              {activity.responseTime && (
                <p className="text-xs text-gray-400 mt-1">
                  Response time: {activity.responseTime}ms
                </p>
              )}

              {/* Metadata */}
              {activity.metadata && typeof activity.metadata === 'object' && Object.keys(activity.metadata).length > 0 && (
                <details className="mt-2 cursor-pointer">
                  <summary className="text-xs text-gray-500 hover:text-gray-400">Details</summary>
                  <pre className="mt-2 p-2 bg-gray-900 rounded text-xs text-gray-300 overflow-auto max-h-40">
                    {JSON.stringify(activity.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

AgentActivityLog.displayName = 'AgentActivityLog';
