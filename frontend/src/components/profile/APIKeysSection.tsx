'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Trash2, RefreshCw, Plus, KeyRound, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!showGenerateModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loadingGenerate) {
        setShowGenerateModal(false);
        setNewKeyName('');
      }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showGenerateModal, loadingGenerate]);

  return (
    <div className="profile-content-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-light text-white">API Keys</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your API keys for programmatic access</p>
        </div>
        <motion.button
          onClick={() => setShowGenerateModal(true)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
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
        </motion.button>
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
          {apiKeys.map((apiKey, idx) => (
            <motion.div
              key={apiKey.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{
                delay: Math.min(idx * 0.035, 0.25),
                duration: 0.28,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              whileHover={{ y: -2 }}
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
                    <motion.button
                      onClick={() => handleCopy(apiKey.key, apiKey.id)}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                      className="p-2 rounded-lg transition-colors hover:brightness-110 text-zinc-400 hover:text-[#b4a7ff]"
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
                      <AnimatePresence mode="wait" initial={false}>
                        {copiedId === apiKey.id ? (
                          <motion.span
                            key="check"
                            initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                            className="flex"
                          >
                            <Check className="w-4 h-4 text-[#86efac]" />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.14 }}
                            className="flex"
                          >
                            <Copy className="w-4 h-4" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {copiedId === apiKey.id && (
                      <motion.p
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -2 }}
                        transition={{ duration: 0.18 }}
                        className="text-[11px] text-[#86efac] mt-1 tracking-[0.005em]"
                      >
                        Copied to clipboard
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => setDeleteConfirm(apiKey.id)}
                    disabled={loadingDelete === apiKey.id}
                    whileHover={loadingDelete === apiKey.id ? undefined : { y: -1 }}
                    whileTap={loadingDelete === apiKey.id ? undefined : { scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                    className="p-2 rounded-lg transition-colors hover:brightness-110 text-zinc-400 hover:text-[#fda4af] disabled:opacity-50"
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
                  </motion.button>
                </div>
              </div>

              {/* Delete Confirmation */}
              <AnimatePresence>
                {deleteConfirm === apiKey.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 0.61, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-3 rounded-lg"
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
                        <motion.button
                          onClick={() => handleDelete(apiKey.id)}
                          disabled={loadingDelete === apiKey.id}
                          whileHover={loadingDelete === apiKey.id ? undefined : { y: -1 }}
                          whileTap={loadingDelete === apiKey.id ? undefined : { scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                          className="flex-1 px-3 py-1.5 text-white rounded-md text-[12px] font-light tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.3) 100%)',
                            boxShadow:
                              'inset 0 0 0 1px rgba(239,68,68,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 14px -4px rgba(239,68,68,0.5)',
                          }}
                        >
                          {loadingDelete === apiKey.id ? 'Deleting...' : 'Delete'}
                        </motion.button>
                        <motion.button
                          onClick={() => setDeleteConfirm(null)}
                          disabled={loadingDelete === apiKey.id}
                          whileHover={loadingDelete === apiKey.id ? undefined : { y: -1 }}
                          whileTap={loadingDelete === apiKey.id ? undefined : { scale: 0.97 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                          className="flex-1 px-3 py-1.5 text-zinc-300 rounded-md text-[12px] font-light tracking-[0.005em] transition-all hover:brightness-110 hover:text-white disabled:opacity-50"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                          }}
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              if (loadingGenerate) return;
              setShowGenerateModal(false);
              setNewKeyName('');
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
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
                    background:
                      'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                  disabled={loadingGenerate}
                />
                <p className="text-xs text-zinc-500 mt-2">Choose a descriptive name for this key</p>
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={handleGenerate}
                  disabled={!newKeyName.trim() || loadingGenerate}
                  whileHover={!newKeyName.trim() || loadingGenerate ? undefined : { y: -1 }}
                  whileTap={!newKeyName.trim() || loadingGenerate ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                  }}
                >
                  {loadingGenerate ? 'Generating...' : 'Generate'}
                </motion.button>
                <motion.button
                  onClick={() => {
                    setShowGenerateModal(false);
                    setNewKeyName('');
                  }}
                  disabled={loadingGenerate}
                  whileHover={loadingGenerate ? undefined : { y: -1 }}
                  whileTap={loadingGenerate ? undefined : { scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="flex-1 px-4 py-2.5 text-zinc-300 rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 hover:text-white disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

APIKeysSection.displayName = 'APIKeysSection';
