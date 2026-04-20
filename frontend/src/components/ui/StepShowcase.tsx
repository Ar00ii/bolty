'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface Step {
  number: string;
  title: string;
  description: string;
}

interface StepShowcaseProps {
  steps: Step[];
  title: string;
}

export function StepShowcase({ steps, title }: StepShowcaseProps) {
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
        {title}
      </motion.h2>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-15" style={{ paddingTop: '60px' }}>
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

            {/* Image Container */}
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
                    + New service
                  </div>
                  {[
                    'Static site',
                    'Web service',
                    'Private service',
                    'Workflow',
                    'Background Worker',
                    'Cron Job',
                  ].map((service, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded"
                      style={{
                        padding: '8px 12px',
                        background:
                          service === 'Web service'
                            ? 'linear-gradient(90deg, #00d992, #00c9a7)'
                            : 'transparent',
                        color: service === 'Web service' ? '#000' : '#888',
                      }}
                    >
                      <span>
                        {service === 'Web service' ? '⚡ ' : ''}
                        {service}
                      </span>
                      {service !== 'Web service' && service !== 'Background Worker' && (
                        <span style={{ marginLeft: 'auto', color: '#00d992' }}>✓</span>
                      )}
                    </div>
                  ))}
                </>
              )}

              {step.number === '2' && (
                <>
                  {[
                    { label: 'Branch', value: '⎇ main' },
                    { label: 'Build Command', value: 'npm build' },
                    { label: 'Start Command', value: 'npm start' },
                  ].map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-1.5"
                      style={{ padding: '6px 12px' }}
                    >
                      <span style={{ color: '#666', fontSize: '12px', minWidth: '100px' }}>
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
                      Manual Deploy ▾
                    </button>
                  </div>
                  <div style={{ color: '#00d992', fontSize: '11px', padding: '8px 12px' }}>
                    ✓ Built in 2.7s
                    <br />
                    ••• Your site is live 🎉
                  </div>
                </>
              )}

              {step.number === '3' && (
                <>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#888',
                      padding: '2px 12px',
                    }}
                  >
                    [main 4f2c9ab] Final tweaks
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: '#ccc',
                      padding: '2px 12px',
                    }}
                  >
                    ~/site $ git push
                  </div>
                  <div style={{ height: '12px' }} />
                  <div
                    style={{
                      background: '#1f1f1f',
                      borderRadius: '6px',
                      padding: '8px',
                      margin: '0 12px',
                      fontSize: '11px',
                      color: '#666',
                    }}
                  >
                    https://yourwebsite.com
                  </div>
                  <div style={{ height: '8px' }} />
                  {[
                    { name: 'Automatic Deploy live: Final tweaks', color: '#00d992' },
                    { name: "Automatic Deploy live: Fix Claude's code", color: '#4f90ff' },
                    { name: 'Manual Deploy live', color: '#00d992' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: item.color,
                        }}
                      />
                      <span style={{ color: '#ccc' }}>{item.name}</span>
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
