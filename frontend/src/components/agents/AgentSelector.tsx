'use client';

import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import React, { useState } from 'react';

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

  const surfaceStyle = {
    background: 'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl" style={surfaceStyle}>
        <div className="h-10 bg-white/[0.06] rounded animate-pulse" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="p-4 rounded-xl text-center" style={surfaceStyle}>
        <p className="text-[13px] text-zinc-400 mb-3 tracking-[0.005em]">No agents created yet</p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-white font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            <Plus className="w-4 h-4" />
            Create First Agent
          </button>
        )}
      </div>
    );
  }

  const getStatusColor = (status: Agent['status']) => {
    if (status === 'ACTIVE') return '34,197,94';
    if (status === 'ERROR') return '239,68,68';
    if (status === 'TESTING') return '245,158,11';
    return '161,161,170';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all hover:brightness-110 text-left"
        style={surfaceStyle}
      >
        <div className="flex-1 min-w-0">
          {selectedAgent ? (
            <>
              <div className="text-[14px] font-light text-white truncate tracking-[0.005em]">
                {selectedAgent.name}
              </div>
              <div className="text-[11px] text-zinc-500 truncate font-mono tracking-[0.005em] mt-0.5">
                {selectedAgent.webhookUrl}
              </div>
            </>
          ) : (
            <div className="text-[13px] text-zinc-400 tracking-[0.005em]">Select an agent</div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 flex-shrink-0 ml-2 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />

          <div
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.95) 0%, rgba(10,10,14,0.95) 100%)',
              boxShadow:
                '0 0 0 1px rgba(131,110,249,0.2), inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px -10px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="max-h-96 overflow-y-auto">
              {agents.map((agent) => {
                const statusColor = getStatusColor(agent.status);
                const isSelected = selectedAgentId === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent.id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 border-b border-white/[0.04] last:border-b-0 transition-all hover:bg-white/[0.03]"
                    style={
                      isSelected
                        ? {
                            background:
                              'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.04) 100%)',
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[14px] font-light truncate tracking-[0.005em] ${isSelected ? 'text-[#b4a7ff]' : 'text-white'}`}
                        >
                          {agent.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate font-mono tracking-[0.005em] mt-0.5">
                          {agent.webhookUrl}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full"
                            style={{
                              background: `rgb(${statusColor})`,
                              boxShadow: `0 0 8px rgba(${statusColor},0.6)`,
                            }}
                          />
                          <span
                            className="text-[10.5px] uppercase tracking-[0.18em] font-medium"
                            style={{ color: `rgb(${statusColor})` }}
                          >
                            {agent.status}
                          </span>
                        </div>
                      </div>
                      {onDeleteAgent && (
                        <button
                          onClick={(e) => handleDelete(e, agent.id)}
                          disabled={deletingId === agent.id}
                          className="p-2 rounded-lg transition-all hover:brightness-110 text-zinc-400 hover:text-[#fda4af] disabled:opacity-50"
                          style={{
                            background:
                              'linear-gradient(180deg, rgba(40,40,48,0.7) 0%, rgba(20,20,26,0.7) 100%)',
                            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                          }}
                        >
                          {deletingId === agent.id ? (
                            <div className="w-3.5 h-3.5 border border-[#fda4af] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {onCreateNew && (
              <>
                <div className="border-t border-white/[0.06]" />
                <button
                  onClick={() => {
                    onCreateNew();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-[13px] text-[#b4a7ff] hover:text-white hover:bg-white/[0.03] transition-all flex items-center gap-2 tracking-[0.005em]"
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
