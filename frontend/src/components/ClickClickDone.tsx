'use client';

import { motion } from 'framer-motion';
import React from 'react';

export function ClickClickDone() {
  const steps = [
    {
      number: '1',
      title: 'Deploy New Agent',
      description: 'Connect your repository and configure your agent deployment settings',
    },
    {
      number: '2',
      title: 'Build Reputation',
      description: 'The most trusted and respected developers in the Bolty ecosystem',
    },
    {
      number: '3',
      title: 'Earn & Grow',
      description: 'AI agents, automation tools, and code repositories. Get instant revenue.',
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
        Publish, earn, grow.
      </motion.h2>

      {/* Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-15"
        style={{ paddingTop: '60px', gap: '80px' }}
      >
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="flex flex-col gap-8"
          >
            {/* Card Text Area */}
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <div
                className="flex items-center justify-center text-white font-normal"
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#9333ea',
                  fontSize: '16px',
                  lineHeight: 1,
                  borderRadius: '50%',
                }}
              >
                {step.number}
              </div>

              {/* Card Content */}
              <div className="flex flex-col gap-3">
                <h3
                  className="text-white font-normal"
                  style={{
                    fontSize: '36px',
                    lineHeight: 1.15,
                    letterSpacing: '-0.8px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="font-normal"
                  style={{
                    fontSize: '20px',
                    lineHeight: 1.38,
                    color: '#e3e3e3',
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>

            {/* Image Container */}
            <div className="relative flex-1 flex flex-col justify-end mt-auto">
              {/* Fade overlay at bottom */}
              <div
                className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
                style={{
                  height: '120px',
                  background: 'linear-gradient(to top, #0d0d0d 0%, transparent 100%)',
                }}
              />

              <div
                className="w-full rounded-lg border flex flex-col gap-3 p-4"
                style={{
                  background: '#1a1a1a',
                  borderColor: '#272727',
                  fontSize: '13px',
                  color: '#888',
                }}
              >
                {step.number === '1' && (
                  <>
                    <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.4 }}>
                      Connect your repository and configure your agent deployment settings
                    </p>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#666',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>Step 3 of 6</span>
                      <span>57%</span>
                    </div>
                    <div
                      style={{
                        height: '4px',
                        background: '#2a2a2a',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ height: '100%', background: '#9333ea', width: '57%' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
                        AI Negotiation Webhook
                      </div>
                      <div
                        style={{
                          background: '#2a2a2a',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#9333ea',
                          fontFamily: 'monospace',
                        }}
                      >
                        https://your-api.com/webhook
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        Endpoint where buyers can negotiate with your agent
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px' }}>
                        Agent File
                      </div>
                      <div
                        style={{
                          border: '1px dashed #444',
                          borderRadius: '4px',
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '11px',
                        }}
                      >
                        <div style={{ color: '#999', marginBottom: '4px' }}>
                          Click to upload agent file
                        </div>
                        <div style={{ color: '#666', fontSize: '10px' }}>
                          js, ts, zip, json, yaml or yml – max 10 MB
                        </div>
                      </div>
                    </div>
                    <button
                      style={{
                        background: '#9333ea',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginTop: 'auto',
                      }}
                    >
                      Setup Integrations ⚡
                    </button>
                  </>
                )}

                {step.number === '2' && (
                  <>
                    <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.4 }}>
                      The most trusted and respected developers in the Bolty ecosystem
                    </p>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#00d992',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        marginBottom: '8px',
                      }}
                    >
                      RANK_TIERS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {['Newcomer', 'Bronze', 'Silver', 'Gold'].map((tier) => (
                        <div
                          key={tier}
                          style={{
                            background: '#9333ea',
                            color: '#fff',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          {tier}
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: '10px',
                        color: '#00d992',
                        fontWeight: 600,
                        letterSpacing: '1px',
                        marginTop: '12px',
                        marginBottom: '8px',
                      }}
                    >
                      HOW TO EARN POINTS
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '11px',
                      }}
                    >
                      {[
                        { text: 'Publish a repository', pts: '+15 pts' },
                        { text: 'Set a locked repository', pts: '+75 pts' },
                        { text: 'Complete your profile', pts: '+10 pts' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#999',
                          }}
                        >
                          <span>{item.text}</span>
                          <span style={{ color: '#00d992' }}>{item.pts}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {step.number === '3' && (
                  <>
                    <p style={{ fontSize: '13px', color: '#999', lineHeight: 1.4 }}>
                      AI agents, automation tools, and code repositories. Get instant revenue.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        marginTop: '8px',
                      }}
                    >
                      {[
                        {
                          icon: '🛒',
                          title: 'AI Agents',
                          desc: 'Discover and buy autonomous AI bots',
                          link: 'Browse marketplace →',
                        },
                        {
                          icon: '📁',
                          title: 'Repositories',
                          desc: 'Browse community code and locked projects',
                          link: 'Browse repos →',
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            border: '1px solid #333',
                            borderRadius: '4px',
                            padding: '8px',
                            fontSize: '11px',
                          }}
                        >
                          <div style={{ color: '#ccc', marginBottom: '2px' }}>
                            {item.icon} {item.title}
                          </div>
                          <div style={{ color: '#999', fontSize: '10px', marginBottom: '4px' }}>
                            {item.desc}
                          </div>
                          <div style={{ color: '#9333ea', fontSize: '10px' }}>{item.link}</div>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9333ea',
                        marginTop: 'auto',
                        textAlign: 'center',
                      }}
                    >
                      Ready to list your first agent? Get started →
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
