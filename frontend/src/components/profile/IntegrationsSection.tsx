'use client';

import React, { useState } from 'react';
import { CheckCircle2, Plus, Trash2, ExternalLink } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  connectedAs?: string;
  url?: string;
}

interface IntegrationsSectionProps {
  integrations: Integration[];
  onConnect: (id: string) => Promise<void>;
  onDisconnect: (id: string) => Promise<void>;
}

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

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Integrations</h2>
        <p className="text-sm text-gray-400 mt-1">Connect your favorite tools and services</p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              ${
                integration.connected
                  ? 'bg-gradient-to-br from-purple-950/40 to-purple-900/10 border-purple-500/30 hover:border-purple-500/50'
                  : 'bg-gray-900/40 border-gray-700/50 hover:border-gray-600'
              }
            `}
          >
            {/* Status Badge */}
            {integration.connected && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1 px-2 py-1 bg-green-900/30 border border-green-700 rounded-full">
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-300 font-medium">Connected</span>
                </div>
              </div>
            )}

            {/* Icon & Name */}
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                {integration.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                {integration.connected && integration.connectedAs && (
                  <p className="text-xs text-gray-400">as {integration.connectedAs}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-400 mb-4">{integration.description}</p>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {integration.connected ? (
                <>
                  {integration.url && (
                    <a
                      href={integration.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  )}
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    disabled={loading === integration.id}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-colors border border-red-800 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  disabled={loading === integration.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  {loading === integration.id ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Connect integrations to unlock automation and sync data across platforms
        </p>
      </div>
    </div>
  );
};

IntegrationsSection.displayName = 'IntegrationsSection';
