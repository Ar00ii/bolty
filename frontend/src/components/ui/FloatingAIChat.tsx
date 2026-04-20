'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageSquare, Bot } from 'lucide-react';
import React, { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom left' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.18 } },
};

export function FloatingAIChat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-4">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-window"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-80 overflow-hidden rounded-2xl flex flex-col"
            style={{
              background: 'rgba(18,18,21,0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(131,110,249,0.2)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
              height: '440px',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{
                borderColor: 'rgba(131,110,249,0.15)',
                background: 'rgba(131,110,249,0.06)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'rgba(131,110,249,0.15)',
                    border: '1px solid rgba(131,110,249,0.3)',
                  }}
                >
                  <Bot className="w-3.5 h-3.5 text-bolty-400" strokeWidth={1.5} />
                </div>
                <div>
                  <span className="text-sm font-light text-white">AI Assistant</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <span className="text-xs text-yellow-400/70">Maintenance</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: 'rgba(161,161,170,0.7)' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Maintenance message */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{
                  background: 'rgba(234,179,8,0.1)',
                  border: '1px solid rgba(234,179,8,0.2)',
                }}
              >
                <Bot className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-light text-white mb-1">AI Assistant</p>
              <div
                className="rounded-lg px-3 py-2 mb-2"
                style={{
                  background: 'rgba(234,179,8,0.08)',
                  border: '1px solid rgba(234,179,8,0.2)',
                }}
              >
                <p className="text-xs text-yellow-400 font-mono font-light">
                  INACTIVE — MAINTENANCE
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(161,161,170,0.6)' }}>
                The AI assistant is temporarily offline for maintenance. We&apos;ll be back soon.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer"
        style={
          open
            ? {
                background: 'rgba(39,39,42,0.95)',
                border: '1px solid rgba(131,110,249,0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }
            : {
                background: 'linear-gradient(135deg, #836EF9, #6b4fe0)',
                border: '1px solid rgba(131,110,249,0.3)',
                boxShadow: '0 4px 20px rgba(131,110,249,0.3)',
              }
        }
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {open ? (
          <X className="w-5 h-5 text-zinc-300" strokeWidth={2} />
        ) : (
          <MessageSquare className="w-5 h-5 text-white" strokeWidth={1.8} />
        )}
      </motion.button>
    </div>
  );
}
