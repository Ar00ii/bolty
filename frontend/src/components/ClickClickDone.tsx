'use client';

import { motion } from 'framer-motion';
import React from 'react';

export function ClickClickDone() {
  const steps = [
    {
      number: '1',
      title: 'Publish your work',
      description: 'Connect GitHub or upload AI agents, repos, and services to the marketplace in seconds.',
    },
    {
      number: '2',
      title: 'Set your price',
      description: 'Define pricing in ETH or free tiers. Manage access levels and licensing directly.',
    },
    {
      number: '3',
      title: 'Earn & grow',
      description: 'Get paid instantly via smart contracts. Build reputation and reach global buyers.',
    },
  ];

  return (
    <section
      className="flex flex-col gap-2 py-20 px-[7%] max-w-[1810px] mx-auto"
      style={{ background: '#0d0d0d' }}
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
        Click, click, done.
      </motion.h2>

      {/* Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-15"
        style={{ paddingTop: '60px' }}
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
            <div className="flex flex-col gap-4">
              {/* Badge */}
              <div
                className="flex items-center justify-center text-white font-normal"
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#48008c',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
              >
                {step.number}
              </div>

              {/* Card Content */}
              <div className="flex flex-col gap-3">
                <h3
                  className="text-white font-normal"
                  style={{
                    fontSize: '32px',
                    lineHeight: 1.15,
                    letterSpacing: '-0.8px',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="font-normal"
                  style={{
                    fontSize: '18px',
                    lineHeight: 1.38,
                    color: '#e3e3e3',
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>

            {/* Image Container - Placeholder */}
            <div
              className="w-full rounded-lg border flex flex-col gap-2 p-4"
              style={{
                aspectRatio: '9 / 10',
                background: '#1a1a1a',
                borderColor: '#272727',
                fontSize: '13px',
                color: '#888',
              }}
            >
              {/* Placeholder content based on step number */}
              {step.number === '1' && (
                <>
                  <div style={{ color: '#666', fontSize: '12px', padding: '4px 12px' }}>
                    📁 Your Projects
                  </div>
                  {[
                    { name: 'AI Chat Agent', type: 'Agent', status: 'Live' },
                    { name: 'Data Pipeline', type: 'Service', status: 'Live' },
                    { name: 'API Toolkit', type: 'Repo', status: 'Live' },
                  ].map((project, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{
                        padding: '8px 12px',
                        background: idx === 0 ? 'linear-gradient(90deg, #00d992, #00c9a7)' : 'transparent',
                        color: idx === 0 ? '#000' : '#888',
                      }}
                    >
                      <span>{project.name}</span>
                      {idx !== 0 && (
                        <span style={{ marginLeft: 'auto', color: '#00d992', fontSize: '11px' }}>
                          ✓ {project.status}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}

              {step.number === '2' && (
                <>
                  {[
                    { label: 'Price (ETH)', value: '0.5 ETH' },
                    { label: 'License', value: 'Commercial' },
                    { label: 'Visibility', value: 'Public' },
                  ].map((field, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-1.5" style={{ padding: '6px 12px' }}>
                      <span style={{ color: '#666', fontSize: '12px', minWidth: '110px' }}>
                        {field.label}
                      </span>
                      <span
                        style={{
                          background: '#2a2a2a',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          color: '#ccc',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          flex: 1,
                        }}
                      >
                        {field.value}
                      </span>
                    </div>
                  ))}
                  <div style={{ marginTop: 'auto', padding: '8px 12px' }}>
                    <button
                      style={{
                        background: '#2a2a2a',
                        color: '#ccc',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Publish Now ▾
                    </button>
                  </div>
                  <div style={{ color: '#00d992', fontSize: '11px', padding: '8px 12px' }}>
                    ✓ Ready to publish
                  </div>
                </>
              )}

              {step.number === '3' && (
                <>
                  <div style={{ color: '#666', fontSize: '12px', padding: '4px 12px' }}>
                    💰 Earnings
                  </div>
                  <div
                    style={{
                      background: '#1f1f1f',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      margin: '8px 12px 0 12px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ color: '#00d992', fontSize: '18px', fontWeight: 600 }}>
                      42.5 ETH
                    </div>
                    <div style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                      Total earned this month
                    </div>
                  </div>
                  <div style={{ height: '12px' }} />
                  {[
                    { buyer: 'User #2847', amount: '2.5 ETH', status: 'Completed' },
                    { buyer: 'User #1923', amount: '5.0 ETH', status: 'Completed' },
                    { buyer: 'User #8471', amount: '3.2 ETH', status: 'Pending' },
                  ].map((transaction, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <div>
                        <div style={{ color: '#ccc' }}>{transaction.buyer}</div>
                        <div style={{ color: '#666', fontSize: '11px' }}>{transaction.amount}</div>
                      </div>
                      <span
                        style={{
                          color:
                            transaction.status === 'Completed'
                              ? '#00d992'
                              : '#ffaa00',
                          fontSize: '11px',
                        }}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
