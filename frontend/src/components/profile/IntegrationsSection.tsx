'use client';

import React, { useState } from 'react';
import { Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

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

const getCategoryLabel = (category: string) => {
  const labels = {
    wallet: 'Web3 Wallets',
    social: 'Social Networks',
    security: 'Security',
    service: 'Services',
  };
  return labels[category as keyof typeof labels] || category;
};

export const IntegrationsSection: React.FC<IntegrationsSectionProps> = ({
  integrations,
  onConnect,
  onDisconnect,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await onConnect(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Unlink this integration?')) return;
    setLoading(id);
    setError(null);
    try {
      await onDisconnect(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setLoading(null);
    }
  };

  const categories = ['wallet', 'social', 'security', 'service'] as const;
  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Integrations</h2>
          <p className="text-xs text-gray-500 mt-1">{connectedCount} of {integrations.length} connected</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryIntegrations = integrations.filter(i => i.category === category);
          if (categoryIntegrations.length === 0) return null;

          return (
            <div key={category} className="space-y-3">
              {/* Category Label */}
              <div className="px-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {getCategoryLabel(category)}
                </h3>
              </div>

              {/* Integration Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categoryIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className={`
                      relative p-3 rounded-lg border transition-all duration-200
                      ${
                        integration.connected
                          ? 'bg-gray-900 border-gray-700 hover:border-gray-600'
                          : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                      }
                    `}
                  >
                    {/* Status Indicator */}
                    {integration.connected && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-gray-900 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-gray-900" />
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center gap-2">
                      {/* Avatar */}
                      <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center text-lg transition-colors
                        ${integration.connected ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-gray-800 border border-gray-700'}
                      `}>
                        {integration.icon}
                      </div>

                      {/* Name & Status */}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{integration.name}</p>
                        {integration.connected ? (
                          <p className="text-xs text-emerald-400 font-medium">Active</p>
                        ) : (
                          <p className="text-xs text-gray-500">Not connected</p>
                        )}
                      </div>

                      {/* Connected As */}
                      {integration.connectedAs && (
                        <p className="text-xs text-gray-600 truncate max-w-full">
                          {integration.connectedAs.length > 15
                            ? integration.connectedAs.slice(0, 12) + '...'
                            : integration.connectedAs}
                        </p>
                      )}

                      {/* Action Button */}
                      <button
                        onClick={() =>
                          integration.connected
                            ? handleDisconnect(integration.id)
                            : handleConnect(integration.id)
                        }
                        disabled={loading === integration.id}
                        className={`
                          mt-2 w-full py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-200
                          flex items-center justify-center gap-1.5
                          disabled:opacity-50 disabled:cursor-not-allowed
                          ${
                            integration.connected
                              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600'
                              : 'bg-white/5 hover:bg-white/10 text-white border border-gray-700 hover:border-gray-600'
                          }
                        `}
                      >
                        {loading === integration.id ? (
                          <>
                            <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                            {integration.connected ? 'Unlinking...' : 'Connecting...'}
                          </>
                        ) : integration.connected ? (
                          <>
                            <X className="w-3 h-3" />
                            Unlink
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Connect
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

IntegrationsSection.displayName = 'IntegrationsSection';
