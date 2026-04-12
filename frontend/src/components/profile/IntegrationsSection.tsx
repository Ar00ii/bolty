'use client';

import React, { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';

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

const IntegrationLogo: React.FC<{ id: string }> = ({ id }) => {
  const logos: Record<string, string> = {
    'metamask': 'MM',
    'walletconnect': 'WC',
    'ledger': 'LDG',
    'twitter': 'X',
    'discord': 'DC',
    'github-social': 'GH',
    'two-factor': '2FA',
    'api-keys': 'API',
  };

  const text = logos[id] || '⚙';

  return (
    <div className="flex items-center justify-center w-6 h-6 font-bold text-sm">
      {text}
    </div>
  );
};

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
    <div className="profile-content-card space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Integrations</h2>
        <p className="text-sm text-gray-400 mt-1">
          {connectedCount} of {integrations.length} connected
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryIntegrations = integrations.filter(i => i.category === category);
          if (categoryIntegrations.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              {/* Category Header */}
              <div className="px-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {getCategoryLabel(category)}
                </h3>
              </div>

              {/* Integration Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categoryIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center text-center
                      ${
                        integration.connected
                          ? 'border-purple-500/40 bg-purple-900/10 hover:border-purple-500/60'
                          : 'border-gray-700 bg-gray-900/40 hover:border-gray-600'
                      }
                    `}
                  >
                    {/* Connected Indicator */}
                    {integration.connected && (
                      <div className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black" />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`
                        p-3 rounded-lg mb-3 transition-colors
                        ${
                          integration.connected
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-800 text-gray-400'
                        }
                      `}
                    >
                      <IntegrationLogo id={integration.id} />
                    </div>

                    {/* Name */}
                    <h4 className="text-sm font-semibold text-white mb-1">{integration.name}</h4>

                    {/* Status */}
                    {integration.connected ? (
                      <p className="text-xs text-emerald-400 font-medium mb-2">Active</p>
                    ) : (
                      <p className="text-xs text-gray-500 mb-2">Not connected</p>
                    )}

                    {/* Connected As */}
                    {integration.connectedAs && (
                      <p className="text-xs text-gray-500 mb-3 truncate w-full">
                        {integration.connectedAs.length > 20
                          ? integration.connectedAs.slice(0, 17) + '...'
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
                        w-full py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200
                        flex items-center justify-center gap-1.5 mt-auto
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${
                          integration.connected
                            ? 'border border-purple-500/40 hover:border-purple-500/60 text-purple-300 hover:text-purple-200 bg-purple-500/5 hover:bg-purple-500/10'
                            : 'border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white bg-gray-800/40 hover:bg-gray-800'
                        }
                      `}
                    >
                      {loading === integration.id ? (
                        <>
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">
                            {integration.connected ? 'Unlinking...' : 'Connecting...'}
                          </span>
                        </>
                      ) : integration.connected ? (
                        <>
                          <X className="w-3.5 h-3.5" />
                          Unlink
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-900/10">
        <p className="text-xs text-gray-300">
          <span className="text-purple-400 font-semibold">Security:</span> Only connect integrations you trust.
          Review and remove unused connections regularly.
        </p>
      </div>
    </div>
  );
};

IntegrationsSection.displayName = 'IntegrationsSection';
