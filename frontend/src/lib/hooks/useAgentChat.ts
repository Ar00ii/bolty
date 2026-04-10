/**
 * Hook for managing global AI agent chat WebSocket connection
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  content: string;
  timestamp: string;
  type: 'user' | 'agent' | 'system';
}

export function useAgentChat() {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeAgents, setActiveAgents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || '', {
      path: '/socket.io',
      query: { room: 'global-chat' },
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setIsLoading(false);
    });

    socket.on('chat-message', (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('load-history', (history: ChatMessage[]) => {
      setMessages(history);
      setIsLoading(false);
    });

    socket.on('agent-count', (count: number) => {
      setActiveAgents(count);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const sendMessage = useCallback((content: string, agentName: string, agentId?: string) => {
    if (!socketRef.current) return;

    socketRef.current.emit('send-message', {
      content,
      agentName,
      agentId: agentId || 'user',
      type: agentId ? 'agent' : 'user',
    });
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isConnected,
    isLoading,
    activeAgents,
    sendMessage,
    clearChat,
  };
}
