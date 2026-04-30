'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import React from 'react';

import { useToast } from '@/lib/hooks/useToast';

interface ToastType {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const TOAST_META: Record<
  ToastType['type'],
  { icon: typeof CheckCircle2; color: string; textColor: string }
> = {
  success: { icon: CheckCircle2, color: '34,197,94', textColor: '#86efac' },
  error: { icon: AlertCircle, color: '239,68,68', textColor: '#fda4af' },
  warning: { icon: AlertTriangle, color: '245,158,11', textColor: '#fcd34d' },
  info: { icon: Info, color: '59,130,246', textColor: '#93c5fd' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onClose }: { toast: ToastType; onClose: () => void }) {
  const meta = TOAST_META[toast.type];
  const Icon = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, x: 60, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="relative flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-xl pointer-events-auto min-w-[280px] max-w-md overflow-hidden"
      style={{
        background: `linear-gradient(180deg, rgba(${meta.color},0.14) 0%, rgba(${meta.color},0.04) 100%), linear-gradient(180deg, rgba(20,20,26,0.96) 0%, rgba(10,10,14,0.96) 100%)`,
        boxShadow: `0 0 0 1px rgba(${meta.color},0.35), inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 36px -12px rgba(0,0,0,0.6)`,
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${meta.color},0.6) 50%, transparent 100%)`,
        }}
      />
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, rgba(${meta.color},0.22) 0%, rgba(${meta.color},0.06) 100%)`,
          boxShadow: `inset 0 0 0 1px rgba(${meta.color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${meta.color},0.45)`,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: meta.textColor }} strokeWidth={1.75} />
      </div>
      <span
        className="text-[13px] font-semibold tracking-[0.005em] flex-1"
        style={{ color: meta.textColor }}
      >
        {toast.message}
      </span>
      <motion.button
        onClick={onClose}
        whileTap={{ scale: 0.88 }}
        whileHover={{ rotate: 90 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className="p-1 rounded-md transition-colors hover:bg-white/10 text-zinc-400 hover:text-white"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  );
}
