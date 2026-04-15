'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

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
  }, [words.length]);

  return (
    <div
      className="relative min-h-screen overflow-hidden border-b"
      style={{
        background: 'linear-gradient(to left bottom, #1c0037, rgba(0,0,0,0) 20%), #0d0d0d',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: 'calc(100% / 16) 100px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-20 md:py-32 items-center min-h-screen">
          {/* LEFT: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8 z-10"
          >
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-light leading-tight text-white">
                Your fastest path to
                <br />
                production for
                <div className="relative h-20 md:h-24">
                  <motion.div
                    key={wordIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="absolute left-0 top-0"
                  >
                    <span
                      style={{
                        background: 'linear-gradient(to right, #9b52fb, #b8ffd7)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                      className="text-6xl md:text-7xl font-light"
                    >
                      {words[wordIndex]}
                    </span>
                    <span
                      className="ml-2 inline-block text-6xl md:text-7xl font-light text-white animate-pulse"
                      style={{
                        background: 'linear-gradient(to top, #373145, rgba(55,49,69,0.5))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      ▌
                    </span>
                  </motion.div>
                </div>
              </h1>

              <p className="text-xl text-white/70 max-w-xl leading-relaxed font-light">
                Intuitive infrastructure to scale any app or agent from your first user to your
                billionth.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/auth?tab=register"
                    className="px-6 md:px-8 py-3 bg-white text-black font-light rounded hover:bg-gray-100 transition-colors text-sm md:text-base flex items-center gap-2"
                  >
                    Start for free <span>›</span>
                  </Link>
                  <Link
                    href="/contact"
                    className="px-6 md:px-8 py-3 border border-white text-white font-light rounded hover:bg-white/10 transition-colors text-sm md:text-base"
                  >
                    Get in touch
                  </Link>
                </>
              ) : (
                <Link
                  href="/market"
                  className="px-8 py-3 bg-white text-black font-light rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  Go to dashboard <span>›</span>
                </Link>
              )}
            </div>
          </motion.div>

          {/* RIGHT: Visual area */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-96 md:h-full flex items-center justify-center"
          >
            <div
              className="absolute inset-0 rounded-xl opacity-30"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #9b52fb 0%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
            {/* Lottie player would go here */}
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              <div className="text-white/20 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <p className="font-light">Interactive dashboard preview</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
