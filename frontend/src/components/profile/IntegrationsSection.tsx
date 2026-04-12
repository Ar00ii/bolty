'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink, Zap, Wallet, Share2, Lock, Code } from 'lucide-react';

interface Integration {
  id: string;
  category: 'wallet' | 'social' | 'service' | 'security';
  name: string;
  description: string;
  icon?: React.ReactNode;
  connected: boolean;
  connectedAs?: string;
  url?: string;
  lastUsedAt?: string;
  verified?: boolean;
}

interface IntegrationsSectionProps {
  integrations: Integration[];
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'wallet':
      return <Wallet className="w-5 h-5" />;
    case 'social':
      return <Share2 className="w-5 h-5" />;
    case 'security':
      return <Lock className="w-5 h-5" />;
    case 'service':
      return <Code className="w-5 h-5" />;
    default:
      return <Zap className="w-5 h-5" />;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'wallet':
      return 'Web3 Wallets';
    case 'social':
      return 'Social Networks';
    case 'security':
      return 'Security';
    case 'service':
      return 'Services';
    default:
      return 'Integrations';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'wallet':
      return { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30', bg: 'from-blue-600/10 to-blue-500/5', border: 'border-blue-500/20' };
    case 'social':
      return { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', bg: 'from-purple-600/10 to-purple-500/5', border: 'border-purple-500/20' };
    case 'security':
      return { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', bg: 'from-emerald-600/10 to-emerald-500/5', border: 'border-emerald-500/20' };
    case 'service':
      return { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30', bg: 'from-orange-600/10 to-orange-500/5', border: 'border-orange-500/20' };
    default:
      return { badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30', bg: 'from-slate-600/10 to-slate-500/5', border: 'border-slate-500/20' };
  }
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
    if (!confirm('Disconnect this integration?')) return;
    setLoading(id);
    try {
      await onDisconnect(id);
    } finally {
      setLoading(null);
    }
  };

  const categories = ['wallet', 'social', 'security', 'service'] as const;
  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="profile-content-card space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Integrations</h2>
        <p className="text-sm text-gray-400">Manage your connected accounts and services</p>

        <div className="mt-4 flex gap-4">
          <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Connected</p>
            <p className="text-lg font-semibold text-white">{connectedCount}</p>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-lg font-semibold text-white">{integrations.length}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryIntegrations = integrations.filter(i => i.category === category);
          if (categoryIntegrations.length === 0) return null;

          const connected = categoryIntegrations.filter(i => i.connected);
          const available = categoryIntegrations.filter(i => !i.connected);
          const colors = getCategoryColor(category);

          return (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white">
                  {getCategoryIcon(category)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{getCategoryLabel(category)}</h3>
                  <p className="text-xs text-gray-500">
                    {connected.length} of {categoryIntegrations.length} connected
                  </p>
                </div>
              </div>

              {/* Connected Integrations */}
              {connected.length > 0 && (
                <div className="space-y-3 pl-11">
                  {connected.map((integration) => (
                    <div
                      key={integration.id}
                      className={`
                        group relative p-4 rounded-lg border transition-all duration-300
                        bg-gradient-to-br ${colors.bg} ${colors.border}
                        hover:border-white/20 hover:shadow-lg hover:shadow-white/5
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-white">{integration.name}</h4>
                            {integration.verified && (
                              <span className="inline-block px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-emerald-300 font-medium">
                                Verified
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.badge}`}>
                              <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                              Active
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">{integration.description}</p>
                          {integration.connectedAs && (
                            <p className="text-xs text-gray-500">
                              Connected as <span className="text-gray-300 font-medium">{integration.connectedAs}</span>
                            </p>
                          )}
                          {integration.lastUsedAt && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Last activity: {new Date(integration.lastUsedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {integration.url && (
                            <a
                              href={integration.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/10"
                              title="View settings"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDisconnect(integration.id)}
                            disabled={loading === integration.id}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20 disabled:opacity-50"
                            title="Disconnect"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Integrations */}
              {available.length > 0 && (
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 pl-11`}>
                  {available.map((integration) => (
                    <div
                      key={integration.id}
                      className={`
                        group relative p-4 rounded-lg border transition-all duration-300
                        bg-gradient-to-br ${colors.bg} ${colors.border} opacity-60
                        hover:opacity-100 hover:border-white/20 hover:shadow-lg hover:shadow-white/5
                      `}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white">{integration.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{integration.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnect(integration.id)}
                        disabled={loading === integration.id}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 border border-white/20 hover:border-white/30 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {loading === integration.id ? 'Connecting...' : 'Connect'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Card */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
        <div className="flex gap-3">
          <Zap className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-300 mb-0.5">Security Notice</p>
            <p className="text-xs text-blue-200 leading-relaxed">
              Only connect integrations that you trust. Review permissions and disconnect accounts you no longer use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

IntegrationsSection.displayName = 'IntegrationsSection';
