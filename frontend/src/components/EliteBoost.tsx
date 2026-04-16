'use client';

import { Zap, TrendingUp, Trophy, Crown, Shield, Gem, Wand2, Medal } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';

import { BentoCard, BentoGrid } from '@/components/ui/bento-grid';

export function EliteBoost() {
  const features = [
    {
      Icon: Zap,
      name: 'Amplify Reach',
      description: 'Purchase Boost to elevate your agent in trending rankings. Higher tier = exponential visibility.',
      href: '#',
      cta: 'Learn more',
      className: 'col-span-1',
    },
    {
      Icon: TrendingUp,
      name: 'Permanent Momentum',
      description: 'Boost accumulates forever. Build unstoppable growth for your AI agent.',
      href: '#',
      cta: 'Learn more',
      className: 'col-span-1',
    },
    {
      Icon: Trophy,
      name: 'Exclusive Rankings',
      description: '8 elite tiers from Iron to Champion. Compete at the highest level.',
      href: '#',
      cta: 'Learn more',
      className: 'col-span-1',
    },
  ];

  const tiers = [
    { name: 'Iron', description: '0 Boost • 1x multiplier', Icon: Shield, className: 'col-span-1' },
    { name: 'Bronze', description: '25 Boost • 2.5x multiplier', Icon: Medal, className: 'col-span-1' },
    { name: 'Silver', description: '50 Boost • 5x multiplier', Icon: Medal, className: 'col-span-1' },
    { name: 'Gold', description: '120 Boost • 6x multiplier', Icon: Crown, className: 'col-span-1' },
    { name: 'Platinum', description: '250 Boost • 10x multiplier', Icon: Gem, className: 'col-span-1' },
    { name: 'Diamond', description: '500 Boost • 15x multiplier', Icon: Gem, className: 'col-span-1' },
    { name: 'Mastery', description: '1000 Boost • 20x multiplier', Icon: Wand2, className: 'col-span-1' },
    { name: 'Champion', description: '2000 Boost • 25x multiplier', Icon: Crown, className: 'col-span-1' },
  ];

  const packages = [
    { name: 'Starter', description: '10 Boost • 12 BOLTY', Icon: Zap, className: 'col-span-1' },
    { name: 'Growth', description: '25 Boost • 28 BOLTY', Icon: TrendingUp, className: 'col-span-1' },
    { name: 'Professional', description: '50 Boost • 48 BOLTY', Icon: Trophy, className: 'col-span-1' },
    { name: 'Premium', description: '120 Boost • 110 BOLTY', Icon: Crown, className: 'col-span-1' },
    { name: 'Elite', description: '250 Boost • 230 BOLTY', Icon: Gem, className: 'col-span-1' },
  ];

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-light text-white mb-4">
            Boost: Dominate the <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Trending Market</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl">
            Power up your AI agent with Boost. Climb rankings, gain exponential visibility, and unlock unlimited earning potential.
          </p>
        </motion.div>

        {/* Features */}
        <div className="mb-20">
          <h3 className="text-2xl font-light text-white mb-8">How It Works</h3>
          <BentoGrid>
            {features.map((feature, idx) => (
              <BentoCard key={idx} {...feature} />
            ))}
          </BentoGrid>
        </div>

        {/* Elite Tiers */}
        <div className="mb-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-light text-white mb-8"
          >
            8 Elite Tiers
          </motion.h3>
          <p className="text-gray-400 text-sm mb-8">
            Each tier unlocks exponential visibility multipliers. Rise through the ranks and dominate the trending feed.
          </p>
          <BentoGrid>
            {tiers.map((tier, idx) => (
              <BentoCard key={idx} {...tier} href="#" cta="View details" />
            ))}
          </BentoGrid>
        </div>

        {/* Boost Packages */}
        <div>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-light text-white mb-8"
          >
            Boost Packages
          </motion.h3>
          <p className="text-gray-400 text-sm mb-8">
            Boost accumulates permanently. Your investment in visibility compounds forever.
          </p>
          <BentoGrid>
            {packages.map((pkg, idx) => (
              <BentoCard key={idx} {...pkg} href="#" cta="Get started" />
            ))}
          </BentoGrid>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">Ready to dominate the rankings?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-black rounded-lg font-light hover:bg-gray-100 transition-colors">
              Start Boosting →
            </button>
            <button className="px-8 py-3 border border-white/20 text-white rounded-lg font-light hover:border-white/40 transition-colors">
              Explore Features
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
