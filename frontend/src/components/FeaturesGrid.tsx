'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Bot, Zap, TrendingUp, ArrowRight, Check } from 'lucide-react';

// Visual components
const MarketplaceVisual = () => (
  <div className="space-y-3 text-xs">
    <div className="flex justify-between text-gray-500">
      <span>Agent Name</span>
      <span>Status</span>
    </div>
    {['GPT-4 Analyzer', 'Voice Bot', 'Data Scraper'].map((name, i) => (
      <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700">
        <span className="text-gray-300">{name}</span>
        <Check className="w-4 h-4 text-green-500" />
      </div>
    ))}
  </div>
);

const AgentsVisual = () => (
  <div className="space-y-2 text-xs">
    <div className="bg-gray-900 rounded p-3 font-mono text-green-400">
      <div>{'{'}</div>
      <div className="ml-2">"agent": "autonomous",</div>
      <div className="ml-2">"status": "active"</div>
      <div>{'}'}</div>
    </div>
  </div>
);

const ZeroOpsVisual = () => (
  <div className="space-y-2">
    <div className="flex items-end gap-1 h-16">
      {[40, 60, 45, 75, 55, 80].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t opacity-60"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    <div className="text-xs text-gray-500 text-center">Auto-scaling</div>
  </div>
);

const AnalyticsVisual = () => (
  <div className="space-y-3 text-xs">
    <div className="grid grid-cols-2 gap-2">
      {[
        { label: 'Requests', value: '12.5K' },
        { label: 'Avg Time', value: '142ms' },
        { label: 'Success', value: '99.8%' },
        { label: 'Cost', value: '$234' }
      ].map((item, i) => (
        <div key={i} className="bg-gray-900 rounded p-2">
          <div className="text-gray-500">{item.label}</div>
          <div className="text-emerald-400 font-light">{item.value}</div>
        </div>
      ))}
    </div>
  </div>
);

interface Feature {
  title: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
  color: string;
  accentColor: string;
  visual: React.ReactNode;
}

const FEATURES_GRID: Feature[] = [
  {
    title: 'Intuitive Marketplace',
    description: 'Discover, publish, and sell AI agents with zero friction. Full visibility into agent performance.',
    details: ['Browse agents', 'Publish custom', 'Track revenue', 'Monetize'],
    icon: <ShoppingCart className="w-12 h-12" />,
    color: 'rgb(34, 211, 238)',
    accentColor: 'rgba(34, 211, 238, 0.1)',
    visual: <MarketplaceVisual />
  },
  {
    title: 'Full-stack AI Agents',
    description: 'Deploy autonomous agents with complete control. Real-time execution and monitoring across your infrastructure.',
    details: ['Custom logic', 'Real-time sync', 'Auto-scaling', 'Analytics'],
    icon: <Bot className="w-12 h-12" />,
    color: 'rgb(59, 130, 246)',
    accentColor: 'rgba(59, 130, 246, 0.1)',
    visual: <AgentsVisual />
  },
  {
    title: 'Zero Ops Deployment',
    description: 'Deploy without operational overhead. Automatic scaling, monitoring, and maintenance included.',
    details: ['Auto-scaling', 'Zero config', 'Built-in monitoring', 'Self-healing'],
    icon: <Zap className="w-12 h-12" />,
    color: 'rgb(168, 85, 247)',
    accentColor: 'rgba(168, 85, 247, 0.1)',
    visual: <ZeroOpsVisual />
  },
  {
    title: 'Real-time Analytics',
    description: 'Monitor agent performance with detailed metrics. Track usage, costs, and ROI in real-time dashboards.',
    details: ['Live metrics', 'Cost tracking', 'Performance data', 'Insights'],
    icon: <TrendingUp className="w-12 h-12" />,
    color: 'rgb(16, 185, 129)',
    accentColor: 'rgba(16, 185, 129, 0.1)',
    visual: <AnalyticsVisual />
  }
];

export const FeaturesGrid = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {FEATURES_GRID.map((feature, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: idx * 0.1 }}
          className="relative group"
          style={{
            border: `1px solid ${feature.color}22`,
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Corner Brackets */}
          <div
            className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 pointer-events-none"
            style={{ borderColor: feature.color }}
          />
          <div
            className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 pointer-events-none"
            style={{ borderColor: feature.color }}
          />
          <div
            className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 pointer-events-none"
            style={{ borderColor: feature.color }}
          />
          <div
            className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 pointer-events-none"
            style={{ borderColor: feature.color }}
          />

          {/* Content */}
          <div className="p-8">
            {/* Icon */}
            <div className="mb-6" style={{ color: feature.color }}>
              {feature.icon}
            </div>

            {/* Title */}
            <h3 className="text-xl font-light mb-3 text-white">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              {feature.description}
            </p>

            {/* Visual */}
            <div className="mb-8 p-4 rounded bg-gray-950/50" style={{ borderLeft: `2px solid ${feature.color}` }}>
              {feature.visual}
            </div>

            {/* Details List */}
            <div className="space-y-2 mb-8">
              {feature.details.map((detail, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: feature.color }}
                  />
                  {detail}
                </div>
              ))}
            </div>

            {/* Learn More Link */}
            <a
              href="#"
              className="inline-flex items-center gap-2 text-xs font-light tracking-wide group/link"
              style={{ color: feature.color }}
            >
              Learn more
              <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
