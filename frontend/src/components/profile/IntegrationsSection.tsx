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
  switch (id) {
    case 'metamask':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="4" width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.1" />
          <path d="M20 8L28 16L24 20L28 24L20 32L16 28L12 32L4 24L8 20L4 16L12 8L16 12L20 8Z" fill="currentColor" />
        </svg>
      );
    case 'walletconnect':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
          <path d="M12 20L20 12L28 20M20 12V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'ledger':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
          <rect x="8" y="8" width="24" height="24" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
          <line x1="14" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth="2" />
          <line x1="14" y1="20" x2="26" y2="20" stroke="currentColor" strokeWidth="1.5" />
          <line x1="14" y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'twitter':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
          <path d="M8 10L16 18L8 26M32 10L24 18L32 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case 'discord':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="currentColor" fillOpacity="0.1">
          <circle cx="14" cy="16" r="2" fill="currentColor" />
          <circle cx="26" cy="16" r="2" fill="currentColor" />
          <path d="M12 24C12 26 14 28 16 28L24 28C26 28 28 26 28 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="8" y="8" width="24" height="24" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'github-social':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="currentColor">
          <path d="M20 4C11.2 4 4 11.2 4 20c0 7.1 4.6 13.1 11 15.2.8.1 1.1-.3 1.1-.8v-2.8c-4.5 1-5.5-2.2-5.5-2.2-.7-1.8-1.8-2.3-1.8-2.3-1.5-1 .1-1 .1-1 1.6.1 2.5 1.7 2.5 1.7 1.5 2.5 3.8 1.8 4.7 1.4.1-1.1.6-1.8 1-2.2-3.5-.4-7.2-1.8-7.2-7.9 0-1.7.6-3.2 1.6-4.3-.2-.4-.7-2 .2-4.2 0 0 1.3-.4 4.4 1.6 1.3-.4 2.6-.6 4-.6 1.3 0 2.7.2 4 .6 3.1-2.1 4.4-1.6 4.4-1.6.8 2.3.3 3.8.1 4.2 1 1.1 1.6 2.6 1.6 4.3 0 6.1-3.7 7.5-7.2 7.9.6.5 1.1 1.5 1.1 3v4.5c0 .5.3.9 1.1.8 6.5-2.1 11-8.1 11-15.2 0-8.8-7.2-16-16-16z" />
        </svg>
      );
    case 'two-factor':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
          <rect x="10" y="14" width="12" height="14" rx="1" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="18" y="14" width="12" height="14" rx="1" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="16" cy="21" r="1.5" fill="currentColor" />
          <circle cx="24" cy="21" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'api-keys':
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="currentColor" fillOpacity="0.1">
          <path d="M8 12H32V14H8V12Z" fill="currentColor" />
          <circle cx="14" cy="20" r="3" fill="currentColor" fillOpacity="0.3" />
          <circle cx="20" cy="20" r="3" fill="currentColor" fillOpacity="0.3" />
          <circle cx="26" cy="20" r="3" fill="currentColor" fillOpacity="0.3" />
          <path d="M8 26H32V28H8V26Z" fill="currentColor" />
        </svg>
      );
    default:
      return (
        <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2" />
          <path d="M20 12V28M12 20H28" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
  }
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
