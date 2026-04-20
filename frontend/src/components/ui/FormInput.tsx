'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import React from 'react';
import { forwardRef, InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
            {label}
            {required && <span className="ml-1 text-[#fda4af]">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full px-3 py-2.5 ${error ? 'pr-9' : ''} rounded-lg text-[13px] font-light text-white placeholder-zinc-600 outline-none transition-all focus:brightness-110 tracking-[0.005em] ${className}`}
            style={{
              background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
              boxShadow: error
                ? 'inset 0 0 0 1px rgba(239,68,68,0.5)'
                : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
            }}
            {...props}
          />
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <AlertCircle
                  className="w-3.5 h-3.5"
                  style={{ color: '#fda4af' }}
                  strokeWidth={1.75}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
              className="text-[12px] mt-1.5 flex items-center gap-1.5 tracking-[0.005em] overflow-hidden"
              style={{ color: '#fda4af' }}
            >
              {error}
            </motion.p>
          )}
          {hint && !error && (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
              transition={{ duration: 0.18 }}
              className="text-[11px] text-zinc-500 mt-1.5 tracking-[0.005em] leading-relaxed"
            >
              {hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';
