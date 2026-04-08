'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function TerminalDemo() {
  const [displayedText, setDisplayedText] = useState('');
  const fullCommand = '$ bolty deploy --agent-toolkit=claude-ai';
  const output = [
    '✓ Initializing deployment...',
    '✓ Building artifact bundle...',
    '✓ Validating smart contracts...',
    '✓ Deploying to Ethereum mainnet...',
    '✓ Agent published successfully!',
    '',
    'Agent ID: agent_7K9mL2nP4qR1sT8uV',
    'Earnings enabled: $ETH',
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullCommand.length) {
        setDisplayedText(fullCommand.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="mx-auto max-w-2xl"
    >
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Glassmorphic border glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Terminal header */}
        <div className="relative border-b border-white/10 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-white/40 font-mono ml-3">bolty@marketplace</span>
        </div>

        {/* Terminal content */}
        <div className="relative px-4 py-4 font-mono text-sm text-green-400/90 space-y-1.5 min-h-[240px]">
          {/* Command line */}
          <div className="flex items-center gap-1">
            <span className="text-purple-400">{displayedText}</span>
            {displayedText.length < fullCommand.length && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="w-2 h-4 bg-green-400/60 inline-block"
              />
            )}
          </div>

          {/* Output */}
          {displayedText === fullCommand && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="space-y-1 text-green-400/80 mt-3 pt-3 border-t border-white/5"
            >
              {output.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  {line}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
