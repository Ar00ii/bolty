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

            {/* Image Container - Empty Placeholder */}
            <div
              className="w-full rounded-lg border"
              style={{
                aspectRatio: '9 / 10',
                background: '#1a1a1a',
                borderColor: '#272727',
              }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
