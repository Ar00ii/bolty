'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '@/lib/hooks/useToast';

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

function Toast({ toast, onClose }: { toast: any; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-green-400" strokeWidth={2} />,
    error: <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={2} />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" strokeWidth={2} />,
    info: <Info className="w-5 h-5 text-blue-400" strokeWidth={2} />,
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/30',
    error: 'bg-red-500/10 border-red-500/30',
    warning: 'bg-yellow-500/10 border-yellow-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  const textColors = {
    success: 'text-green-200',
    error: 'text-red-200',
    warning: 'text-yellow-200',
    info: 'text-blue-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: 100 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 100 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border pointer-events-auto ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <span className={`text-sm font-light ${textColors[toast.type]}`}>{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-auto opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
