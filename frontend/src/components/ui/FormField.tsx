'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import React, { useRef } from 'react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  containerClassName = '',
  className = '',
  disabled,
  ...props
}) => {
  const idRef = useRef<string>();
  if (!idRef.current) {
    // eslint-disable-next-line react-hooks/purity
    idRef.current = props.id || `field-${Math.random().toString(36).substr(2, 9)}`;
  }
  const id = idRef.current;

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500"
        >
          {label}
          {required && <span className="ml-1 text-[#fda4af]">*</span>}
        </label>
      )}

      <input
        id={id}
        {...props}
        disabled={disabled}
        className={`w-full px-3 py-2.5 rounded-lg text-[13px] outline-none text-white placeholder-zinc-600 transition-all focus:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed tracking-[0.005em] ${className}`}
        style={{
          background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
          boxShadow: error
            ? 'inset 0 0 0 1px rgba(239,68,68,0.5)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />

      <AnimatePresence mode="wait" initial={false}>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
            id={`${id}-error`}
            className="flex items-center gap-2 text-[12px] tracking-[0.005em] mt-1 overflow-hidden"
            style={{ color: '#fda4af' }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
            <span>{error}</span>
          </motion.div>
        )}

        {hint && !error && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18 }}
            id={`${id}-hint`}
            className="text-[11px] text-zinc-500 mt-1 tracking-[0.005em] leading-relaxed"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

FormField.displayName = 'FormField';
