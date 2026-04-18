'use client';

import {
  Activity,
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import React from 'react';

import type { Agent } from '@/hooks/useAgentManagement';

interface AgentMetricsDisplayProps {
  metrics: Agent['metrics'] | null;
  loading?: boolean;
}

interface MetricItem {
  label: string;
  value: string;
  color: string;
  textColor: string;
  icon: LucideIcon;
}

export const AgentMetricsDisplay: React.FC<AgentMetricsDisplayProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="relative p-4 rounded-xl overflow-hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="h-3 bg-white/[0.06] rounded w-24 mb-3 animate-pulse" />
            <div className="h-7 bg-white/[0.06] rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
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
          <Activity className="w-5 h-5 text-[#b4a7ff]" />
        </div>
        <p className="text-[13px] text-zinc-400 tracking-[0.005em]">No metrics available</p>
      </div>
    );
  }

  const successRate =
    metrics.totalCalls > 0 ? Math.round((metrics.successfulCalls / metrics.totalCalls) * 100) : 0;

  const items: MetricItem[] = [
    {
      label: 'Total Calls',
      value: metrics.totalCalls.toLocaleString(),
      color: '59,130,246',
      textColor: '#93c5fd',
      icon: Activity,
    },
    {
      label: 'Successful',
      value: metrics.successfulCalls.toLocaleString(),
      color: '34,197,94',
      textColor: '#86efac',
      icon: CheckCircle2,
    },
    {
      label: 'Failed',
      value: metrics.failedCalls.toLocaleString(),
      color: '239,68,68',
      textColor: '#fda4af',
      icon: XCircle,
    },
    {
      label: 'Avg Response Time',
      value: `${metrics.avgResponseTime}ms`,
      color: '131,110,249',
      textColor: '#b4a7ff',
      icon: Zap,
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      color: '245,158,11',
      textColor: '#fcd34d',
      icon: TrendingUp,
    },
    {
      label: 'Last Call',
      value: metrics.lastCallAt ? new Date(metrics.lastCallAt).toLocaleDateString() : 'Never',
      color: '161,161,170',
      textColor: '#d4d4d8',
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
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
                background: `linear-gradient(90deg, transparent 0%, rgba(${item.color},0.4) 50%, transparent 100%)`,
              }}
            />
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                {item.label}
              </p>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, rgba(${item.color},0.22) 0%, rgba(${item.color},0.06) 100%)`,
                  boxShadow: `inset 0 0 0 1px rgba(${item.color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${item.color},0.45)`,
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: item.textColor }} />
              </div>
            </div>
            <p
              className="text-2xl font-light tabular-nums tracking-[-0.01em]"
              style={{ color: item.textColor }}
            >
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
};

AgentMetricsDisplay.displayName = 'AgentMetricsDisplay';
