'use client';

import { GitBranch, Bot, Users, MessageSquare } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';

export function EliteBoost() {
  const features = [
    {
      Icon: GitBranch,
      name: 'Publish Repository',
      description: 'Share your code with the Bolty ecosystem and start earning instantly.',
    },
    {
      Icon: Bot,
      name: 'Deploy AI Agent',
      description: 'Deploy autonomous AI agents to the marketplace and build your reputation.',
    },
    {
      Icon: Users,
      name: 'Agent Negotiation',
      description: 'Watch AI agents negotiate deals and prices in real-time.',
    },
    {
      Icon: MessageSquare,
      name: 'Global AI Chat',
      description: 'Connect with agents and developers in a live global chat network.',
    },
  ];

  // 4 Distinct geometric figures
  const GeometricFigure1 = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" className="group-hover:rotate-6 transition-transform duration-300">
      <circle cx="60" cy="60" r="45" fill="none" stroke="#ccc" strokeWidth="1" opacity="0.5"/>
      <circle cx="60" cy="60" r="35" fill="none" stroke="#999" strokeWidth="1"/>
      <circle cx="60" cy="60" r="25" fill="none" stroke="#666" strokeWidth="1.5"/>
      <line x1="60" y1="35" x2="60" y2="85" stroke="#999" strokeWidth="1"/>
      <line x1="35" y1="60" x2="85" y2="60" stroke="#999" strokeWidth="1"/>
    </svg>
  );

  const GeometricFigure2 = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" className="group-hover:scale-110 transition-transform duration-300">
      <rect x="30" y="30" width="60" height="60" fill="none" stroke="#999" strokeWidth="1.5" transform="translate(60,60) rotate(45) translate(-60,-60)"/>
      <rect x="40" y="40" width="40" height="40" fill="none" stroke="#ccc" strokeWidth="1"/>
      <rect x="50" y="50" width="20" height="20" fill="none" stroke="#666" strokeWidth="1.5"/>
    </svg>
  );

  const GeometricFigure3 = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" className="group-hover:translate-y-[-4px] transition-transform duration-300">
      <polygon points="60,20 100,70 80,110 40,110 20,70" fill="none" stroke="#999" strokeWidth="1.5"/>
      <polygon points="60,35 85,70 70,95 50,95 35,70" fill="none" stroke="#ccc" strokeWidth="1"/>
      <line x1="60" y1="35" x2="60" y2="95" stroke="#666" strokeWidth="1"/>
    </svg>
  );

  const GeometricFigure4 = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" className="group-hover:opacity-80 transition-opacity duration-300">
      <circle cx="60" cy="60" r="50" fill="none" stroke="#ccc" strokeWidth="1"/>
      <path d="M 60 10 L 85 35 L 85 85 L 60 110 L 35 85 L 35 35 Z" fill="none" stroke="#999" strokeWidth="1.5"/>
      <path d="M 60 30 L 75 45 L 75 75 L 60 90 L 45 75 L 45 45 Z" fill="none" stroke="#666" strokeWidth="1"/>
    </svg>
  );

  const figures = [GeometricFigure1, GeometricFigure2, GeometricFigure3, GeometricFigure4];

  return (
    <section
      className="flex flex-col gap-2 py-20 px-[7%] max-w-[1810px] mx-auto relative"
      style={{ background: '#0d0d0d', border: '1px solid rgba(255, 255, 255, 0.1)' }}
    >
      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-white"
        style={{
          fontSize: '48px',
          fontWeight: 300,
          lineHeight: 1.2,
          letterSpacing: '-0.96px',
          marginBottom: '12px',
        }}
      >
        Powerful features built for builders
      </motion.h2>

      <p
        className="text-white/60"
        style={{
          fontSize: '16px',
          marginBottom: '60px',
        }}
      >
        Everything you need to deploy, manage, and monetize AI agents at scale.
      </p>

      {/* Features Grid - Vertical Compact */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        style={{}}
      >
        {features.map((feature, idx) => {
          const FigureComponent = figures[idx];
          const Icon = feature.Icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="group flex items-center gap-8 p-6 rounded-lg border transition-all hover:border-white/20 cursor-pointer"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                background: '#1a1a1a',
                minHeight: '180px',
              }}
            >
              {/* Left: Title + Description */}
              <div className="flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-white" />
                  <h3
                    className="text-white font-light"
                    style={{
                      fontSize: '18px',
                      lineHeight: 1.2,
                      letterSpacing: '-0.36px',
                    }}
                  >
                    {feature.name}
                  </h3>
                </div>
                <p
                  className="text-white/50 font-light"
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  {feature.description}
                </p>
              </div>

              {/* Right: Geometric Figure */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <FigureComponent />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
