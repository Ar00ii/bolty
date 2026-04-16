'use client';

import { motion } from 'framer-motion';
import React from 'react';

export function EliteBoost() {
  const tiers = [
    { name: 'Iron', icon: '🛡️', boost: 0, multiplier: '1k' },
    { name: 'Bronze', icon: '🥉', boost: 25, multiplier: '2.5k' },
    { name: 'Silver', icon: '🥈', boost: 50, multiplier: '5k' },
    { name: 'Gold', icon: '👑', boost: 100, multiplier: '6x' },
    { name: 'Platinum', icon: '💎', boost: 250, multiplier: '10x' },
    { name: 'Diamond', icon: '✨', boost: 500, multiplier: '15x' },
    { name: 'Mastery', icon: '⚡', boost: 1000, multiplier: '20x' },
    { name: 'Champion', icon: '👑', boost: 2000, multiplier: '25x' },
  ];

  const packages = [
    { name: 'Starter', boost: 10, bolty: 12 },
    { name: 'Growth', boost: 25, bolty: 28 },
    { name: 'Professional', boost: 50, bolty: 48 },
    { name: 'Premium', boost: 120, bolty: 110 },
    { name: 'Elite', boost: 250, bolty: 230 },
  ];

  const tierColors = ['#475569', '#ea580c', '#64748b', '#eab308', '#a855f7', '#06b6d4', '#3b82f6', '#ef4444'];

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
        Rise through the ranks.
      </motion.h2>

      {/* Elite Tiers Section */}
      <div style={{ paddingTop: '60px' }}>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white"
          style={{
            fontSize: '28px',
            fontWeight: 400,
            marginBottom: '40px',
            letterSpacing: '-0.6px',
          }}
        >
          8 Elite Tiers
        </motion.h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '12px',
            marginBottom: '60px',
          }}
        >
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              className="rounded-lg p-4"
              style={{
                background: tierColors[i],
                color: '#fff',
                textAlign: 'center',
                fontSize: '14px',
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>{tier.icon}</div>
              <div style={{ fontWeight: 500, marginBottom: '8px' }}>{tier.name}</div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                {tier.boost} Boost
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
                {tier.multiplier}
              </div>
            </motion.div>
          ))}
        </div>

        <p
          className="text-white/60"
          style={{
            fontSize: '14px',
            marginBottom: '80px',
            textAlign: 'center',
          }}
        >
          Each tier unlocks exponential visibility multipliers. Rise through the ranks and dominate the trending feed.
        </p>
      </div>

      {/* Boost Packages Section */}
      <div>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white"
          style={{
            fontSize: '28px',
            fontWeight: 400,
            marginBottom: '40px',
            letterSpacing: '-0.6px',
          }}
        >
          Boost Packages
        </motion.h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '20px',
            marginBottom: '60px',
          }}
        >
          {packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-lg border p-6"
              style={{
                borderColor: '#333',
                background: '#0d0d0d',
              }}
            >
              <div
                className="text-white"
                style={{
                  fontSize: '18px',
                  fontWeight: 400,
                  marginBottom: '20px',
                }}
              >
                {pkg.name}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div
                  className="text-white"
                  style={{
                    fontSize: '32px',
                    fontWeight: 300,
                  }}
                >
                  {pkg.boost}
                </div>
                <div
                  className="text-white/60"
                  style={{
                    fontSize: '12px',
                    marginTop: '4px',
                  }}
                >
                  Boost
                </div>
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 300,
                  color: '#a855f7',
                }}
              >
                {pkg.bolty}
              </div>
              <div
                className="text-white/60"
                style={{
                  fontSize: '12px',
                  marginTop: '4px',
                }}
              >
                BOLTY
              </div>
            </motion.div>
          ))}
        </div>

        <p
          className="text-white/60"
          style={{
            fontSize: '14px',
            marginBottom: '40px',
            textAlign: 'center',
          }}
        >
          Boost accumulates permanently. Your investment in visibility compounds forever.
        </p>
      </div>

      {/* CTA Section */}
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
            Start Boosting <span style={{ marginLeft: '6px' }}>→</span>
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
