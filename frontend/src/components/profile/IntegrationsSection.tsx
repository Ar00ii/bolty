'use client';

import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2, ExternalLink, Zap, AlertCircle, MessageSquare, Github, CreditCard } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon?: string | React.ReactNode;
  connected: boolean;
  connectedAs?: string;
  url?: string;
  lastUsedAt?: string;
}

const getIntegrationIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower === 'slack') return <MessageSquare className="w-6 h-6" />;
  if (lower === 'github') return <Github className="w-6 h-6" />;
  if (lower === 'stripe') return <CreditCard className="w-6 h-6" />;
  return <Zap className="w-6 h-6" />;
};

interface IntegrationsSectionProps {
  integrations: Integration[];
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}

// Integration provider color schemes
const providerColors: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  slack: { bg: 'from-purple-600/10 to-purple-500/5', border: 'border-purple-500/20', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', text: 'text-purple-400' },
  github: { bg: 'from-gray-600/10 to-gray-500/5', border: 'border-gray-500/20', badge: 'bg-gray-500/20 text-gray-300 border-gray-500/30', text: 'text-gray-400' },
  stripe: { bg: 'from-blue-600/10 to-blue-500/5', border: 'border-blue-500/20', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', text: 'text-blue-400' },
  default: { bg: 'from-slate-600/10 to-slate-500/5', border: 'border-slate-500/20', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30', text: 'text-slate-400' },
};

const getProviderColor = (name: string) => {
  const key = name.toLowerCase();
  return providerColors[key] || providerColors.default;
};

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  integrations,
  onConnect,
  onDisconnect,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setLoading(id);
    try {
      await onConnect(id);
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    setLoading(id);
    try {
      await onDisconnect(id);
    } finally {
      setLoading(null);
    }
  };

  const connectedCount = integrations.filter(i => i.connected).length;
  const disconnectedCount = integrations.length - connectedCount;

  return (
    <div className="profile-content-card space-y-8">
      {/* Header with Stats */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Integrations</h2>
        <p className="text-sm text-gray-400">Connect your favorite tools and automate your workflow</p>

        {/* Quick Stats */}
        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Connected</p>
            <p className="text-lg font-semibold text-white">{connectedCount}</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Available</p>
            <p className="text-lg font-semibold text-white">{integrations.length}</p>
          </div>
        </div>
      </div>

      {/* Connected Integrations */}
      {connectedCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-semibold text-green-400">Active Integrations</h3>
          </div>

          <div className="space-y-3">
            {integrations
              .filter(i => i.connected)
              .map((integration) => {
                const colors = getProviderColor(integration.name);
                return (
                  <div
                    key={integration.id}
                    className={`
                      group relative p-5 rounded-xl border transition-all duration-300
                      bg-gradient-to-br ${colors.bg} ${colors.border}
                      hover:border-white/20 hover:shadow-lg hover:shadow-white/5
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white flex-shrink-0 group-hover:border-white/20 transition-colors`}>
                          {typeof integration.icon === 'string' ? integration.icon : getIntegrationIcon(integration.name)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors.badge}`}>
                              <span className="w-2 h-2 bg-current rounded-full"></span>
                              Connected
                            </span>
                          </div>

                          <p className="text-xs text-gray-400 mb-2">{integration.description}</p>

                          {integration.connectedAs && (
                            <p className="text-xs text-gray-500">
                              Connected as <span className="text-gray-300 font-medium">{integration.connectedAs}</span>
                            </p>
                          )}

                          {integration.lastUsedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last used: {new Date(integration.lastUsedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {integration.url && (
                          <a
                            href={integration.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10"
                            title="View settings"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleDisconnect(integration.id)}
                          disabled={loading === integration.id}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20 disabled:opacity-50"
                          title="Disconnect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      {disconnectedCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-400">Available to Connect</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations
              .filter(i => !i.connected)
              .map((integration) => {
                const colors = getProviderColor(integration.name);
                return (
                  <div
                    key={integration.id}
                    className={`
                      group relative p-5 rounded-xl border transition-all duration-300
                      bg-gradient-to-br ${colors.bg} ${colors.border} opacity-60
                      hover:opacity-100 hover:border-white/20 hover:shadow-lg hover:shadow-white/5
                    `}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white flex-shrink-0 group-hover:border-white/20 transition-colors`}>
                          {typeof integration.icon === 'string' ? integration.icon : getIntegrationIcon(integration.name)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{integration.description}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConnect(integration.id)}
                      disabled={loading === integration.id}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {loading === integration.id ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {integrations.length === 0 && (
        <div className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">No integrations available yet</p>
        </div>
      )}

      {/* Info Card */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="flex gap-3">
          <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-300 mb-0.5">Pro Tip</p>
            <p className="text-xs text-blue-200 leading-relaxed">
              Connect integrations to automate workflows, sync data in real-time, and streamline your operations across multiple platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

IntegrationsSection.displayName = 'IntegrationsSection';
