'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  AgentSelector,
  AgentMetricsDisplay,
  AgentActivityLog,
  CreateAgentModal,
} from '@/components/agents';
import { RaysShop, RaysDisplay, RaysLeaderboards } from '@/components/rays';
import { useAgentManagement } from '@/hooks/useAgentManagement';

export const AgentDashboard: React.FC = () => {
  const {
    agents,
    selectedAgentId,
    selectedAgent,
    metrics,
    activityLog,
    loading,
    error,
    setSelectedAgentId,
    createAgent,
    deleteAgent,
    testWebhook,
  } = useAgentManagement();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [webhookTestId, setWebhookTestId] = useState<string | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    responseTime: number;
    error?: string;
  } | null>(null);
  const [raysRefreshTrigger, setRaysRefreshTrigger] = useState(0);

  const handleTestWebhook = async () => {
    if (!selectedAgentId) return;
    setWebhookTestId(selectedAgentId);
    try {
      const result = await testWebhook(selectedAgentId);
      setWebhookTestResult(result);
      setTimeout(() => setWebhookTestResult(null), 5000);
    } finally {
      setWebhookTestId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">AI Agents</h2>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage multiple autonomous AI agents with independent configurations
          </p>
        </div>
      </div>

      {/* Agent Selector */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">Select Agent</label>
        <AgentSelector
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
          onCreateNew={() => setIsCreateModalOpen(true)}
          onDeleteAgent={deleteAgent}
          loading={loading}
        />
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <div className="space-y-6">
          {/* Agent Info Card */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
                  Agent Name
                </p>
                <p className="text-lg font-semibold text-white">{selectedAgent.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      selectedAgent.status === 'ACTIVE'
                        ? 'bg-emerald-500'
                        : selectedAgent.status === 'ERROR'
                        ? 'bg-red-500'
                        : selectedAgent.status === 'TESTING'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}
                  />
                  <span className="text-sm text-gray-300">{selectedAgent.status}</span>
                </div>
              </div>
            </div>

            {selectedAgent.description && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
                  Description
                </p>
                <p className="text-sm text-gray-300">{selectedAgent.description}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
                Webhook URL
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-purple-400 truncate">
                  {selectedAgent.webhookUrl}
                </code>
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookTestId === selectedAgentId}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium transition-colors text-sm"
                >
                  {webhookTestId === selectedAgentId ? 'Testing...' : 'Test'}
                </button>
              </div>

              {webhookTestResult && (
                <div
                  className={`mt-3 p-3 rounded-lg text-sm ${
                    webhookTestResult.success
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/20 border border-red-500/30 text-red-400'
                  }`}
                >
                  {webhookTestResult.success ? (
                    <>
                      ✓ Connection successful ({webhookTestResult.responseTime}ms)
                    </>
                  ) : (
                    <>✕ Connection failed: {webhookTestResult.error}</>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Agent Metrics</h3>
            <AgentMetricsDisplay metrics={metrics} loading={loading} />
          </div>

          {/* Rays Section */}
          <div className="space-y-6 pt-6 border-t border-gray-700">
            {/* Rays Display */}
            <div>
              <RaysDisplay
                agentId={selectedAgentId}
                refreshTrigger={raysRefreshTrigger}
              />
            </div>

            {/* Purchase Rays */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
              <RaysShop
                agentId={selectedAgentId}
                onPurchaseSuccess={() => setRaysRefreshTrigger(prev => prev + 1)}
              />
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            <AgentActivityLog activities={activityLog} loading={loading} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && agents.length === 0 && (
        <div className="p-12 rounded-lg bg-gray-800/30 border border-gray-700 text-center">
          <p className="text-gray-400 mb-4">No agents created yet</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Agent
          </button>
        </div>
      )}

      {/* Rays Leaderboards */}
      <div className="pt-6 border-t border-gray-700">
        <RaysLeaderboards />
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createAgent}
        loading={loading}
      />
    </div>
  );
};

AgentDashboard.displayName = 'AgentDashboard';
