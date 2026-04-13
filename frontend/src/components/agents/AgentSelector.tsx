'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { Agent } from '@/hooks/useAgentManagement';

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (id: string) => void;
  onCreateNew?: () => void;
  onDeleteAgent?: (id: string) => Promise<void>;
  loading?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  onCreateNew,
  onDeleteAgent,
  loading = false,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleDelete = async (e: React.MouseEvent, agentId: string) => {
    e.stopPropagation();
    if (!onDeleteAgent) return;

    if (!confirm('Delete this agent?')) return;

    try {
      setDeletingId(agentId);
      await onDeleteAgent(agentId);
    } finally {
      setDeletingId(null);
      setIsDropdownOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
        <div className="h-10 bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 text-center">
        <p className="text-sm text-gray-400 mb-3">No agents created yet</p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Agent
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-700 bg-gray-800/50 hover:border-gray-600 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          {selectedAgent ? (
            <>
              <div className="text-sm font-light text-white truncate">{selectedAgent.name}</div>
              <div className="text-xs text-gray-400 truncate">{selectedAgent.webhookUrl}</div>
            </>
          ) : (
            <div className="text-sm text-gray-400">Select an agent</div>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-2 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    onSelectAgent(agent.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-800 last:border-b-0 transition-colors ${
                    selectedAgentId === agent.id
                      ? 'bg-purple-900/30 border-b-purple-500/30'
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-light text-white truncate">{agent.name}</div>
                      <div className="text-xs text-gray-400 truncate mt-1">{agent.webhookUrl}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          agent.status === 'ACTIVE'
                            ? 'bg-emerald-500'
                            : agent.status === 'ERROR'
                            ? 'bg-red-500'
                            : agent.status === 'TESTING'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }`} />
                        <span className="text-xs text-gray-500">{agent.status}</span>
                      </div>
                    </div>
                    {onDeleteAgent && (
                      <button
                        onClick={(e) => handleDelete(e, agent.id)}
                        disabled={deletingId === agent.id}
                        className="p-2 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        {deletingId === agent.id ? (
                          <div className="w-4 h-4 border border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {onCreateNew && (
              <>
                <div className="border-t border-gray-800" />
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-purple-400 hover:bg-purple-900/20 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create New Agent
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

AgentSelector.displayName = 'AgentSelector';
