'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface RenderHeroProps {
  isAuthenticated?: boolean;
}

export function RenderHero({ isAuthenticated = false }: RenderHeroProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const words = [
    'any workload',
    'apps & agents',
    'workflows',
    'APIs & web apps',
    'data pipelines',
    'HIPAA apps',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative overflow-hidden border-b"
      style={{
        background:
          'linear-gradient(to left bottom, #1c0037, rgba(0,0,0,0) 20%), #0d0d0d',
        borderColor: 'rgba(39,39,39)',
        minHeight: 'calc(100vh - 90px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(16, 1fr)',
      }}
    >
      {/* Grid lines overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: 'calc(100% / 16) 100px',
        }}
      />

      {/* LEFT COLUMN - Text Content */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10"
        style={{
          gridColumn: '2 / 9',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 0',
          gap: '40px',
        }}
      >
        {/* Hero Text Group */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h1
            className="text-white font-light"
            style={{
              fontSize: '80px',
              lineHeight: '80px',
              letterSpacing: '-2.4px',
            }}
          >
            Your fastest path to
            <br />
            production for
            <div
              style={{
                display: 'block',
                position: 'relative',
                minHeight: '80px',
                marginTop: '8px',
              }}
            >
              <motion.div
                key={wordIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    background: 'linear-gradient(to right, #9b52fb, #b8ffd7)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '80px',
                    lineHeight: '80px',
                    fontWeight: 300,
                    letterSpacing: '-2.4px',
                  }}
                >
                  {words[wordIndex]}
                </span>
                <motion.span
                  animate={{ opacity: [1, 1, 0, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                  style={{
                    display: 'inline-flex',
                    height: '1em',
                    width: '0.6ch',
                    alignItems: 'center',
                    background: 'linear-gradient(to top, #373145, rgba(55,49,69,0.5))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '80px',
                  }}
                >
                  ▌
                </motion.span>
              </motion.div>
            </div>
          </h1>

          <p
            className="text-white/70"
            style={{
              fontSize: '20px',
              lineHeight: '1.5',
              maxWidth: '480px',
            }}
          >
            Intuitive infrastructure to scale any app or agent from your first user to your
            billionth.
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {!isAuthenticated ? (
            <>
              <Link
                href="/auth?tab=register"
                className="hover:opacity-85 transition-opacity"
                style={{
                  fontSize: '20px',
                  fontWeight: 400,
                  padding: '20px 24px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#fff',
                  color: '#0d0d0d',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                Start for free <span style={{ fontSize: '18px' }}>›</span>
              </Link>
              <Link
                href="/contact"
                className="hover:opacity-85 transition-opacity"
                style={{
                  fontSize: '20px',
                  fontWeight: 400,
                  padding: '20px 24px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid #fff',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                Get in touch
              </Link>
            </>
          ) : (
            <Link
              href="/market"
              className="hover:opacity-85 transition-opacity"
              style={{
                fontSize: '20px',
                fontWeight: 400,
                padding: '20px 24px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                background: '#fff',
                color: '#0d0d0d',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              Go to dashboard <span style={{ fontSize: '18px' }}>›</span>
            </Link>
          )}
        </div>
      </motion.div>

      {/* RIGHT COLUMN - Visual/Lottie */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative"
        style={{
          gridColumn: '9 / 18',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        {/* Placeholder for Lottie animation */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            aspectRatio: '630 / 591',
            background: 'radial-gradient(circle at 50% 50%, #9b52fb 0%, transparent 70%)',
            filter: 'blur(60px)',
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', fontWeight: 300 }}>Interactive preview</p>
        </div>
      </motion.div>
    </div>
  );
}
