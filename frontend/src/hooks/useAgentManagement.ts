import { useState, useEffect, useCallback } from 'react';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  webhookUrl: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'ERROR';
  createdAt: string;
  updatedAt: string;
  metrics?: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    avgResponseTime: number;
    lastCallAt?: string;
  };
}

export interface AgentActivityLogEntry {
  id: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'TIMEOUT';
  metadata?: any;
  responseTime?: number;
  createdAt: string;
}

interface UseAgentManagementResult {
  agents: Agent[];
  selectedAgentId: string | null;
  selectedAgent: Agent | null;
  metrics: Agent['metrics'] | null;
  activityLog: AgentActivityLogEntry[];
  loading: boolean;
  error: string | null;
  setSelectedAgentId: (id: string | null) => void;
  createAgent: (data: { name: string; description?: string; webhookUrl: string }) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  testWebhook: (id: string) => Promise<{ success: boolean; responseTime: number; error?: string }>;
  fetchAgents: () => Promise<void>;
  fetchMetrics: (id: string) => Promise<void>;
  fetchActivityLog: (id: string, limit?: number) => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export function useAgentManagement(): UseAgentManagementResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedAgentId');
    }
    return null;
  });
  const [metrics, setMetrics] = useState<Agent['metrics'] | null>(null);
  const [activityLog, setActivityLog] = useState<AgentActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

  // Save selected agent to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedAgentId) {
      localStorage.setItem('selectedAgentId', selectedAgentId);
    }
  }, [selectedAgentId]);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/agents`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch agents');
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch metrics for an agent
  const fetchMetrics = useCallback(async (agentId: string) => {
    try {
      const response = await fetch(`${API_URL}/agents/${agentId}/metrics`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    }
  }, []);

  // Fetch activity log for an agent
  const fetchActivityLog = useCallback(async (agentId: string, limit = 50) => {
    try {
      const response = await fetch(`${API_URL}/agents/${agentId}/activity-log?limit=${limit}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch activity log');
      const data = await response.json();
      setActivityLog(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity log');
    }
  }, []);

  // Create agent
  const createAgent = useCallback(
    async (data: { name: string; description?: string; webhookUrl: string }): Promise<Agent> => {
      try {
        setError(null);
        const response = await fetch(`${API_URL}/agents`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create agent');
        const result = await response.json();
        const newAgent = result.agent;
        setAgents((prev) => [newAgent, ...prev]);
        // Auto-select the newly created agent
        setSelectedAgentId(newAgent.id);
        return newAgent;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create agent';
        setError(message);
        throw err;
      }
    },
    [],
  );

  // Update agent
  const updateAgent = useCallback(async (agentId: string, data: Partial<Agent>): Promise<Agent> => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update agent');
      const result = await response.json();
      const updatedAgent = result.agent;
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updatedAgent : a)));
      return updatedAgent;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update agent';
      setError(message);
      throw err;
    }
  }, []);

  // Delete agent
  const deleteAgent = useCallback(
    async (agentId: string) => {
      try {
        setError(null);
        const response = await fetch(`${API_URL}/agents/${agentId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to delete agent');
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
        // Clear selection if deleted agent was selected
        if (selectedAgentId === agentId) {
          setSelectedAgentId(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete agent';
        setError(message);
        throw err;
      }
    },
    [selectedAgentId],
  );

  // Test webhook
  const testWebhook = useCallback(
    async (
      agentId: string,
    ): Promise<{ success: boolean; responseTime: number; error?: string }> => {
      try {
        setError(null);
        const response = await fetch(`${API_URL}/agents/${agentId}/test`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to test webhook');
        const result = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to test webhook';
        setError(message);
        throw err;
      }
    },
    [],
  );

  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Fetch metrics and activity log when agent is selected
  useEffect(() => {
    if (selectedAgentId) {
      fetchMetrics(selectedAgentId);
      fetchActivityLog(selectedAgentId);
    }
  }, [selectedAgentId, fetchMetrics, fetchActivityLog]);

  return {
    agents,
    selectedAgentId,
    selectedAgent,
    metrics,
    activityLog,
    loading,
    error,
    setSelectedAgentId,
    createAgent,
    updateAgent,
    deleteAgent,
    testWebhook,
    fetchAgents,
    fetchMetrics,
    fetchActivityLog,
  };
}
