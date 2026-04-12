'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Agent } from '@/hooks/useAgentManagement';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string; webhookUrl: string }) => Promise<Agent>;
  loading?: boolean;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    webhookUrl: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Agent name is required');
      return;
    }

    if (!formData.webhookUrl.trim()) {
      setError('Webhook URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.webhookUrl);
    } catch {
      setError('Invalid webhook URL');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        webhookUrl: formData.webhookUrl.trim(),
      });
      setFormData({ name: '', description: '', webhookUrl: '' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Create New Agent</h3>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">
              Agent Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Negotiation Bot v2"
              disabled={submitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description of what this agent does"
              disabled={submitting}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Webhook URL */}
          <div>
            <label className="block text-sm text-gray-300 mb-2 font-medium">
              Webhook URL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://your-server.com/webhook"
              disabled={submitting}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              The endpoint where webhook events will be sent
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Agent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

CreateAgentModal.displayName = 'CreateAgentModal';
