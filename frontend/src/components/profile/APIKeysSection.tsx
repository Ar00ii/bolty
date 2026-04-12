'use client';

import React, { useState } from 'react';
import { Copy, Trash2, RefreshCw, Plus } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">API Keys</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate New
        </button>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400 mb-4">No API keys yet</p>
          <p className="text-sm text-gray-500">Create your first API key to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div
              key={apiKey.id}
              className="p-4 border border-gray-700 rounded-lg bg-gray-900/50 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-white truncate">{apiKey.name}</h3>
                    <span className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded">
                      {apiKey.scopes[0] || 'read'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm text-gray-300">
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Used</p>
                      <p className="text-sm text-gray-300">
                        {apiKey.lastUsed
                          ? new Date(apiKey.lastUsed).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Key Display */}
                  <div className="flex items-center gap-2">
                    <code className="flex-1 min-w-0 text-xs bg-[#050506] text-gray-400 px-3 py-2 rounded font-mono truncate">
                      {apiKey.preview}••••••••
                    </code>
                    <button
                      onClick={() => handleCopy(apiKey.key, apiKey.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-purple-400"
                      title="Copy full key"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedId === apiKey.id && (
                    <p className="text-xs text-green-400 mt-1">✓ Copied to clipboard</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDeleteConfirm(apiKey.id)}
                    disabled={loadingDelete === apiKey.id}
                    className="p-2 hover:bg-red-900/20 rounded-lg transition-colors text-gray-400 hover:text-red-400 disabled:opacity-50"
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
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-sm text-red-300 mb-3">
                    Are you sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(apiKey.id)}
                      disabled={loadingDelete === apiKey.id}
                      className="flex-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {loadingDelete === apiKey.id ? 'Deleting...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      disabled={loadingDelete === apiKey.id}
                      className="flex-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">Generate New API Key</h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                disabled={loadingGenerate}
              />
              <p className="text-xs text-gray-500 mt-1">
                Choose a descriptive name for this key
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={!newKeyName.trim() || loadingGenerate}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingGenerate ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setNewKeyName('');
                }}
                disabled={loadingGenerate}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
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
