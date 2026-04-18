'use client';

import { Copy, Trash2, RefreshCw, Plus, KeyRound, Check } from 'lucide-react';
import React, { useState } from 'react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  preview: string;
  createdAt: string;
  lastUsed: string | null;
  scopes: string[];
}

interface APIKeysSectionProps {
  apiKeys: APIKey[];
  onDelete: (id: string) => Promise<void>;
  onGenerate: (name: string) => Promise<void>;
  onCopy: (key: string) => void;
}

export const APIKeysSection: React.FC<APIKeysSectionProps> = ({
  apiKeys,
  onDelete,
  onGenerate,
  onCopy,
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCopy = (key: string, id: string) => {
    onCopy(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      setLoadingDelete(id);
      await onDelete(id);
      setDeleteConfirm(null);
    } finally {
      setLoadingDelete(null);
    }
  };

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return;
    try {
      setLoadingGenerate(true);
      await onGenerate(newKeyName);
      setNewKeyName('');
      setShowGenerateModal(false);
    } finally {
      setLoadingGenerate(false);
    }
  };

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-light text-white">API Keys</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110"
          style={{
            background:
              'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
            boxShadow:
              'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
          }}
        >
          <Plus className="w-4 h-4" />
          Generate New
        </button>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div
          className="relative p-12 rounded-xl text-center overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.4) 50%, transparent 100%)',
            }}
          />
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{
              background:
                'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px -4px rgba(131,110,249,0.5)',
            }}
          >
            <KeyRound className="w-5 h-5 text-[#b4a7ff]" />
          </div>
          <p className="text-[13px] text-zinc-400 tracking-[0.005em] mb-1">No API keys yet</p>
          <p className="text-xs text-zinc-500">Create your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="relative p-4 rounded-xl overflow-hidden transition-all hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.4) 50%, transparent 100%)',
                }}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                        boxShadow:
                          'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
                      }}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#b4a7ff]" />
                    </div>
                    <h3 className="font-light text-white truncate tracking-[0.005em]">
                      {apiKey.name}
                    </h3>
                    <span
                      className="text-[10.5px] font-medium uppercase tracking-[0.18em] px-2 py-0.5 rounded-md text-[#b4a7ff]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
                      }}
                    >
                      {apiKey.scopes[0] || 'read'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-1">
                        Created
                      </p>
                      <p className="text-[13px] text-zinc-300 tabular-nums tracking-[0.005em]">
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-1">
                        Last Used
                      </p>
                      <p className="text-[13px] text-zinc-300 tabular-nums tracking-[0.005em]">
                        {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Key Display */}
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 min-w-0 text-[12px] text-zinc-400 px-3 py-2 rounded-lg font-mono truncate tracking-[0.005em]"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                      }}
                    >
                      {apiKey.preview}••••••••
                    </code>
                    <button
                      onClick={() => handleCopy(apiKey.key, apiKey.id)}
                      className="p-2 rounded-lg transition-all hover:brightness-110 text-zinc-400 hover:text-[#b4a7ff]"
                      style={{
                        background:
                          copiedId === apiKey.id
                            ? 'linear-gradient(180deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 100%)'
                            : 'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                        boxShadow:
                          copiedId === apiKey.id
                            ? 'inset 0 0 0 1px rgba(34,197,94,0.4)'
                            : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                      }}
                      title="Copy full key"
                    >
                      {copiedId === apiKey.id ? (
                        <Check className="w-4 h-4 text-[#86efac]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {copiedId === apiKey.id && (
                    <p className="text-[11px] text-[#86efac] mt-1 tracking-[0.005em]">
                      Copied to clipboard
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeleteConfirm(apiKey.id)}
                    disabled={loadingDelete === apiKey.id}
                    className="p-2 rounded-lg transition-all hover:brightness-110 text-zinc-400 hover:text-[#fda4af] disabled:opacity-50"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    }}
                    title="Delete key"
                  >
                    {loadingDelete === apiKey.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deleteConfirm === apiKey.id && (
                <div
                  className="mt-4 p-3 rounded-lg"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.3)',
                  }}
                >
                  <p className="text-[13px] text-[#fda4af] mb-3 tracking-[0.005em]">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(apiKey.id)}
                      disabled={loadingDelete === apiKey.id}
                      className="flex-1 px-3 py-1.5 text-white rounded-md text-[12px] font-light tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.3) 100%)',
                        boxShadow:
                          'inset 0 0 0 1px rgba(239,68,68,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 14px -4px rgba(239,68,68,0.5)',
                      }}
                    >
                      {loadingDelete === apiKey.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      disabled={loadingDelete === apiKey.id}
                      className="flex-1 px-3 py-1.5 text-zinc-300 rounded-md text-[12px] font-light tracking-[0.005em] transition-all hover:brightness-110 hover:text-white disabled:opacity-50"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="relative rounded-xl p-6 max-w-md w-full overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.95) 0%, rgba(10,10,14,0.95) 100%)',
              boxShadow:
                '0 0 0 1px rgba(131,110,249,0.2), inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px -10px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.55) 50%, transparent 100%)',
              }}
            />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
                }}
              >
                <KeyRound className="w-4 h-4 text-[#b4a7ff]" />
              </div>
              <h3 className="text-lg font-light text-white tracking-[-0.005em]">
                Generate New API Key
              </h3>
            </div>

            <div className="mb-5">
              <label className="block text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API"
                className="w-full px-3 py-2.5 rounded-lg text-white placeholder-zinc-600 focus:outline-none text-[13px] tracking-[0.005em] transition-all focus:brightness-110"
                style={{
                  background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
                disabled={loadingGenerate}
              />
              <p className="text-xs text-zinc-500 mt-2">Choose a descriptive name for this key</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={!newKeyName.trim() || loadingGenerate}
                className="flex-1 px-4 py-2.5 text-white rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                }}
              >
                {loadingGenerate ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setNewKeyName('');
                }}
                disabled={loadingGenerate}
                className="flex-1 px-4 py-2.5 text-zinc-300 rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 hover:text-white disabled:opacity-50"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

APIKeysSection.displayName = 'APIKeysSection';
