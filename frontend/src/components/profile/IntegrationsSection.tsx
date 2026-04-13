'use client';

import React, { useState } from 'react';
import { Plus, X, AlertCircle, Shield } from 'lucide-react';
import Image from 'next/image';

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
  // Special icons for integrations without logos
  if (id === 'two-factor') {
    return <Shield className="w-8 h-8" />;
  }

  if (id === 'api-keys') {
    return <span className="text-xl font-light">API</span>;
  }

  if (id === 'ledger') {
    return <span className="text-xl font-light">LDG</span>;
  }

  const logoMap: Record<string, string> = {
    'metamask': '/integrations/metamask.png',
    'walletconnect': '/integrations/walletconnect.png',
    'twitter': '/integrations/X.png',
    'discord': '/integrations/discord.png',
    'github-social': '/integrations/github.png',
  };

  const logo = logoMap[id];
  if (!logo) return <span className="text-xl font-light">?</span>;

  return (
    <div className="relative w-8 h-8">
      <Image
        src={logo}
        alt={id}
        fill
        className="object-contain"
        unoptimized
      />
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
  const [twoFASetup, setTwoFASetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState('');

  const handleConnect = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      // Special handling for 2FA
      if (id === 'two-factor') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${apiUrl}/auth/2fa/enable/request`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to enable 2FA');
        const data = await response.json();
        setTwoFASetup(data);
        setTwoFACode('');
        return;
      }

      await onConnect(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    } finally {
      setLoading(null);
    }
  };

  const handleTwoFACodeSubmit = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading('two-factor');
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const response = await fetch(`${apiUrl}/auth/2fa/enable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode }),
      });
      if (!response.ok) throw new Error('Invalid authenticator code');
      setTwoFASetup(null);
      setTwoFACode('');
      // Refresh integrations
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Unlink this integration?')) return;
    setLoading(id);
    setError(null);
    try {
      // Special handling for 2FA
      if (id === 'two-factor') {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const response = await fetch(`${apiUrl}/auth/2fa/disable`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to disable 2FA');
        return;
      }

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
        <h2 className="text-xl font-light text-white">Integrations</h2>
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

      {/* 2FA Setup Modal */}
      {twoFASetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-white">Set up Google Authenticator</h3>
              <button
                onClick={() => {
                  setTwoFASetup(null);
                  setTwoFACode('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-300 mb-4">
                  Scan this QR code with Google Authenticator or any TOTP app:
                </p>
                <div className="bg-white p-4 rounded-lg flex justify-center">
                  <img src={twoFASetup.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Or enter this code manually:</p>
                <code className="block bg-gray-800 p-3 rounded text-center font-mono text-sm text-purple-400 break-words">
                  {twoFASetup.secret}
                </code>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Enter the 6-digit code from your authenticator app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  pattern="\d{6}"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <button
                onClick={handleTwoFACodeSubmit}
                disabled={loading === 'two-factor' || twoFACode.length !== 6}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-light py-2 rounded-lg transition-colors"
              >
                {loading === 'two-factor' ? 'Verifying...' : 'Verify and Enable'}
              </button>
            </div>
          </div>
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
                <h3 className="text-xs font-light text-gray-400 uppercase tracking-widest">
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

                    {/* Logo */}
                    <div
                      className={`
                        p-3 rounded-lg mb-3 transition-colors flex items-center justify-center
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
                    <h4 className="text-sm font-light text-white mb-1">{integration.name}</h4>

                    {/* Status */}
                    {integration.connected ? (
                      <p className="text-xs text-emerald-400 font-light mb-2">Active</p>
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
                        w-full py-2 px-3 rounded-lg text-xs font-light transition-all duration-200
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
          <span className="text-purple-400 font-light">Security:</span> Only connect integrations you trust.
          Review and remove unused connections regularly.
        </p>
      </div>
    </div>
  );
};

IntegrationsSection.displayName = 'IntegrationsSection';
