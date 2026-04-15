'use client';

import {
  LogIn,
  KeyRound,
  Settings,
  Download,
  Shield,
  Zap,
  FileText,
  AlertCircle,
} from 'lucide-react';
import React from 'react';

interface ActivityEvent {
  id: string;
  type:
    | 'login'
    | 'api_key'
    | 'settings'
    | 'download'
    | 'security'
    | 'deployment'
    | 'file'
    | 'warning';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

interface ActivityLogSectionProps {
  events: ActivityEvent[];
  onExport?: () => Promise<void>;
}

const eventConfig = {
  login: {
    icon: LogIn,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
  },
  api_key: {
    icon: KeyRound,
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
  },
  settings: {
    icon: Settings,
    color: 'text-gray-400',
    bg: 'bg-gray-900/20',
  },
  download: {
    icon: Download,
    color: 'text-green-400',
    bg: 'bg-green-900/20',
  },
  security: {
    icon: Shield,
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
  },
  deployment: {
    icon: Zap,
    color: 'text-orange-400',
    bg: 'bg-orange-900/20',
  },
  file: {
    icon: FileText,
    color: 'text-indigo-400',
    bg: 'bg-indigo-900/20',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-900/20',
  },
};

export const ActivityLogSection: React.FC<ActivityLogSectionProps> = ({ events, onExport }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-white">Activity Log</h2>
          <p className="text-sm text-gray-400 mt-1">Your recent account activity</p>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-light transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No activity yet</div>
            <p className="text-sm text-gray-600">Your account activity will appear here</p>
          </div>
        ) : (
          events.map((event, index) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;

            return (
              <div key={event.id} className="relative">
                {/* Timeline connector */}
                {index < events.length - 1 && (
                  <div className="absolute left-6 top-12 w-0.5 h-4 bg-gradient-to-b from-gray-700 to-transparent" />
                )}

                {/* Event item */}
                <div className="flex gap-4 pb-2">
                  {/* Icon circle */}
                  <div
                    className={`relative flex-shrink-0 w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-sm font-light text-white">{event.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-1 bg-gray-800/50 text-gray-400 rounded"
                          >
                            {key}: <span className="text-gray-300">{value}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load more hint */}
      {events.length > 0 && (
        <div className="pt-4 border-t border-gray-700 text-center">
          <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Load more activity
          </button>
        </div>
      )}
    </div>
  );
};

ActivityLogSection.displayName = 'ActivityLogSection';
