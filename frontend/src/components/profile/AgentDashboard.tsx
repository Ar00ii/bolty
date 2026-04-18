'use client';

import { Plus } from 'lucide-react';
import React, { useState } from 'react';

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
        <div
          className="p-4 rounded-lg text-[#fda4af] text-[13px] tracking-[0.005em]"
          style={{
            background:
              'linear-gradient(180deg, rgba(244,63,94,0.12) 0%, rgba(244,63,94,0.03) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(244,63,94,0.3)',
          }}
        >
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-white">AI Agents</h2>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage multiple autonomous AI agents with independent configurations
          </p>
        </div>
      </div>

      {/* Agent Selector */}
      <div className="relative rounded-xl p-6 overflow-hidden bg-[linear-gradient(180deg,rgba(20,20,26,0.6)_0%,rgba(10,10,14,0.6)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.03)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent_0%,rgba(131,110,249,0.4)_50%,transparent_100%)] before:pointer-events-none">
        <label className="block text-sm font-light text-gray-300 mb-3">Select Agent</label>
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
          <div className="relative rounded-xl p-6 overflow-hidden bg-[linear-gradient(180deg,rgba(20,20,26,0.6)_0%,rgba(10,10,14,0.6)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.03)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent_0%,rgba(131,110,249,0.4)_50%,transparent_100%)] before:pointer-events-none">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-light mb-2">
                  Agent Name
                </p>
                <p className="text-lg font-light text-white">{selectedAgent.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-light mb-2">
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
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-light mb-2">
                  Description
                </p>
                <p className="text-sm text-gray-300">{selectedAgent.description}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-light mb-2">
                Webhook URL
              </p>
              <div className="flex items-center gap-2">
                <code
                  className="flex-1 rounded-lg px-3 py-2 text-sm text-[#b4a7ff] truncate font-mono"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
                  }}
                >
                  {selectedAgent.webhookUrl}
                </code>
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookTestId === selectedAgentId}
                  className="px-4 py-2 rounded-lg disabled:opacity-50 text-white font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
                    boxShadow:
                      'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
                  }}
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
                    <>✓ Connection successful ({webhookTestResult.responseTime}ms)</>
                  ) : (
                    <>✕ Connection failed: {webhookTestResult.error}</>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div>
            <h3 className="text-lg font-light text-white mb-4">Agent Metrics</h3>
            <AgentMetricsDisplay metrics={metrics} loading={loading} />
          </div>

          {/* Rays Section */}
          <div className="space-y-6 pt-6 border-t border-white/[0.06]">
            {/* Rays Display */}
            {selectedAgentId && (
              <div>
                <RaysDisplay agentId={selectedAgentId} refreshTrigger={raysRefreshTrigger} />
              </div>
            )}

            {/* Purchase Rays */}
            {selectedAgentId && (
              <div className="relative rounded-xl p-6 overflow-hidden bg-[linear-gradient(180deg,rgba(20,20,26,0.6)_0%,rgba(10,10,14,0.6)_100%)] shadow-[0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.03)] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent_0%,rgba(131,110,249,0.4)_50%,transparent_100%)] before:pointer-events-none">
                <RaysShop
                  agentId={selectedAgentId}
                  onPurchaseSuccess={() => setRaysRefreshTrigger((prev) => prev + 1)}
                />
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="text-lg font-light text-white mb-4">Activity Log</h3>
            <AgentActivityLog activities={activityLog} loading={loading} />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && agents.length === 0 && (
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
                'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.45) 50%, transparent 100%)',
            }}
          />
          <p className="text-zinc-400 mb-4 text-[13px] tracking-[0.005em]">No agents created yet</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            <Plus className="w-5 h-5" />
            Create Your First Agent
          </button>
        </div>
      )}

      {/* Rays Leaderboards */}
      <div className="pt-6 border-t border-white/[0.06]">
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
