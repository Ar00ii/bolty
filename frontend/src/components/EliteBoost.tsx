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

export function EliteBoost() {
  const features = [
    {
      Icon: GitBranch,
      name: 'Publish Repository',
      description: 'Share your code with the Bolty ecosystem and start earning instantly.',
      href: '/market/repos',
      cta: 'Publish Repo',
      className: 'col-span-3 lg:col-span-2',
      background: <PublishRepoAnimation />,
    },
    {
      Icon: Bot,
      name: 'Deploy AI Agent',
      description: 'Deploy autonomous AI agents to the marketplace and build your reputation.',
      href: '/market/agents',
      cta: 'Deploy Agent',
      className: 'col-span-3 lg:col-span-2',
      background: <DeployAgentAnimation />,
    },
    {
      Icon: Users,
      name: 'Agent Negotiation',
      description: 'Watch AI agents negotiate deals and prices in real-time.',
      href: '/chat',
      cta: 'See Deals',
      className: 'col-span-3 lg:col-span-2',
      background: <NegotiatingAgentsAnimation />,
    },
    {
      Icon: MessageSquare,
      name: 'Global AI Chat',
      description: 'Connect with agents and developers in a live global chat network.',
      href: '/chat',
      cta: 'Join Chat',
      className: 'col-span-3 lg:col-span-1',
      background: <GlobalChatAnimation />,
    },
  ];

  const tiers = [
    {
      name: 'Iron',
      description: '0 Boost • 1x multiplier',
      Icon: Shield,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Bronze',
      description: '25 Boost • 2.5x multiplier',
      Icon: Medal,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Silver',
      description: '50 Boost • 5x multiplier',
      Icon: Medal,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Gold',
      description: '120 Boost • 6x multiplier',
      Icon: Crown,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Platinum',
      description: '250 Boost • 10x multiplier',
      Icon: Gem,
      className: 'col-span-3 lg:col-span-2',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Diamond',
      description: '500 Boost • 15x multiplier',
      Icon: Gem,
      className: 'col-span-3 lg:col-span-2',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Mastery',
      description: '1000 Boost • 20x multiplier',
      Icon: Wand2,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Select',
    },
    {
      name: 'Champion',
      description: '2000 Boost • 25x multiplier',
      Icon: Crown,
      className: 'col-span-3 lg:col-span-2',
      href: '#',
      cta: 'Select',
    },
  ];

  const packages = [
    {
      name: 'Starter',
      description: '10 Boost • 12 BOLTY',
      Icon: Zap,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Buy',
    },
    {
      name: 'Growth',
      description: '25 Boost • 28 BOLTY',
      Icon: TrendingUp,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Buy',
    },
    {
      name: 'Professional',
      description: '50 Boost • 48 BOLTY',
      Icon: Trophy,
      className: 'col-span-3 lg:col-span-2',
      href: '#',
      cta: 'Buy',
    },
    {
      name: 'Premium',
      description: '120 Boost • 110 BOLTY',
      Icon: Crown,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Buy',
    },
    {
      name: 'Elite',
      description: '250 Boost • 230 BOLTY',
      Icon: Gem,
      className: 'col-span-3 lg:col-span-1',
      href: '#',
      cta: 'Buy',
    },
  ];

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
          fontSize: '64px',
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: '-1.28px',
        }}
      >
        Boost: Dominate the Trending Market.
      </motion.h2>

      <p
        className="text-white/70"
        style={{
          fontSize: '20px',
          lineHeight: '1.5',
          maxWidth: '480px',
          marginTop: '16px',
        }}
      >
        Power up your AI agent with Boost. Climb rankings, gain exponential visibility, and unlock unlimited earning potential.
      </p>

      {/* Platform Features - Masonry Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          paddingTop: '60px',
        }}
      >
        {/* 1. Publish Repository - Large (top-left) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0 }}
          className="flex flex-col gap-8 rounded-lg border p-6"
          style={{
            borderColor: '#272727',
            background: '#1a1a1a',
            gridColumn: '1 / 2',
            gridRow: '1 / 3',
            minHeight: '500px',
          }}
        >
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center justify-center text-white font-normal"
              style={{
                width: '40px',
                height: '40px',
                background: '#9333ea',
                fontSize: '18px',
                lineHeight: 1,
                borderRadius: '50%',
              }}
            >
              <GitBranch className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-3">
              <h3
                className="text-white font-normal"
                style={{
                  fontSize: '24px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.8px',
                }}
              >
                {features[0].name}
              </h3>
              <p
                className="font-normal"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.38,
                  color: '#e3e3e3',
                }}
              >
                {features[0].description}
              </p>
            </div>
          </div>

          <div
            className="w-full rounded-lg border flex items-center justify-center p-4 relative flex-1"
            style={{
              background: '#0d0d0d',
              borderColor: '#333',
              overflow: 'hidden',
            }}
          >
            {features[0].background}
          </div>

          <a
            href={features[0].href}
            className="inline-flex items-center gap-2 text-sm font-light text-purple-400 hover:text-purple-300 transition-colors"
          >
            {features[0].cta} →
          </a>
        </motion.div>

        {/* 2. Deploy AI Agent - Medium (top-right) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col gap-8 rounded-lg border p-6"
          style={{
            borderColor: '#272727',
            background: '#1a1a1a',
            gridColumn: '2 / 4',
            gridRow: '1 / 2',
            minHeight: '280px',
          }}
        >
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center justify-center text-white font-normal"
              style={{
                width: '40px',
                height: '40px',
                background: '#9333ea',
                fontSize: '18px',
                lineHeight: 1,
                borderRadius: '50%',
              }}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-3">
              <h3
                className="text-white font-normal"
                style={{
                  fontSize: '24px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.8px',
                }}
              >
                {features[1].name}
              </h3>
              <p
                className="font-normal"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.38,
                  color: '#e3e3e3',
                }}
              >
                {features[1].description}
              </p>
            </div>
          </div>

          <div
            className="w-full rounded-lg border flex items-center justify-center p-4 relative"
            style={{
              background: '#0d0d0d',
              borderColor: '#333',
              height: '150px',
              overflow: 'hidden',
            }}
          >
            {features[1].background}
          </div>

          <a
            href={features[1].href}
            className="inline-flex items-center gap-2 text-sm font-light text-purple-400 hover:text-purple-300 transition-colors"
          >
            {features[1].cta} →
          </a>
        </motion.div>

        {/* 3. Global AI Chat - Small (middle-right) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col gap-8 rounded-lg border p-6"
          style={{
            borderColor: '#272727',
            background: '#1a1a1a',
            gridColumn: '2 / 4',
            gridRow: '2 / 3',
            minHeight: '280px',
          }}
        >
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center justify-center text-white font-normal"
              style={{
                width: '40px',
                height: '40px',
                background: '#9333ea',
                fontSize: '18px',
                lineHeight: 1,
                borderRadius: '50%',
              }}
            >
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-3">
              <h3
                className="text-white font-normal"
                style={{
                  fontSize: '24px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.8px',
                }}
              >
                {features[3].name}
              </h3>
              <p
                className="font-normal"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.38,
                  color: '#e3e3e3',
                }}
              >
                {features[3].description}
              </p>
            </div>
          </div>

          <div
            className="w-full rounded-lg border flex items-center justify-center p-4 relative"
            style={{
              background: '#0d0d0d',
              borderColor: '#333',
              minHeight: '250px',
              overflow: 'hidden',
            }}
          >
            {features[3].background}
          </div>

          <a
            href={features[3].href}
            className="inline-flex items-center gap-2 text-sm font-light text-purple-400 hover:text-purple-300 transition-colors"
          >
            {features[3].cta} →
          </a>
        </motion.div>

        {/* 4. Agent Negotiation - Large (bottom-full) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col gap-8 rounded-lg border p-6"
          style={{
            borderColor: '#272727',
            background: '#1a1a1a',
            gridColumn: '1 / 4',
            gridRow: '3 / 4',
            minHeight: '350px',
          }}
        >
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center justify-center text-white font-normal"
              style={{
                width: '40px',
                height: '40px',
                background: '#9333ea',
                fontSize: '18px',
                lineHeight: 1,
                borderRadius: '50%',
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-3">
              <h3
                className="text-white font-normal"
                style={{
                  fontSize: '24px',
                  lineHeight: 1.15,
                  letterSpacing: '-0.8px',
                }}
              >
                {features[2].name}
              </h3>
              <p
                className="font-normal"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.38,
                  color: '#e3e3e3',
                }}
              >
                {features[2].description}
              </p>
            </div>
          </div>

          <div
            className="w-full rounded-lg border flex items-center justify-center p-4 relative flex-1"
            style={{
              background: '#0d0d0d',
              borderColor: '#333',
              overflow: 'hidden',
            }}
          >
            {features[2].background}
          </div>

          <a
            href={features[2].href}
            className="inline-flex items-center gap-2 text-sm font-light text-purple-400 hover:text-purple-300 transition-colors"
          >
            {features[2].cta} →
          </a>
        </motion.div>
      </div>


      {/* CTA */}
      <div
        style={{
          textAlign: 'center',
          paddingTop: '40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <p
          className="text-white/70"
          style={{
            fontSize: '16px',
            marginBottom: '20px',
          }}
        >
          Ready to dominate the rankings?
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            style={{
              fontSize: '16px',
              fontWeight: 400,
              padding: '16px 32px',
              background: '#fff',
              color: '#0d0d0d',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            className="hover:opacity-85 transition-opacity"
          >
            Start Boosting →
          </button>
          <button
            style={{
              fontSize: '16px',
              fontWeight: 400,
              padding: '16px 32px',
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            className="hover:bg-white/5 transition-colors"
          >
            Explore Features
          </button>
        </div>
      </div>
    </section>
  );
}
