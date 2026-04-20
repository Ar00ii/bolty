'use client';

import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import React from 'react';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  closeable?: boolean;
}

const alertConfig: Record<
  AlertType,
  { icon: typeof AlertCircle; color: string; textColor: string }
> = {
  error: { icon: AlertCircle, color: '239,68,68', textColor: '#fda4af' },
  success: { icon: CheckCircle, color: '34,197,94', textColor: '#86efac' },
  info: { icon: Info, color: '59,130,246', textColor: '#93c5fd' },
  warning: { icon: AlertTriangle, color: '245,158,11', textColor: '#fcd34d' },
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onClose,
  closeable = true,
}) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative p-4 rounded-xl flex items-start gap-3 overflow-hidden"
      role="alert"
      style={{
        background: `linear-gradient(180deg, rgba(${config.color},0.12) 0%, rgba(${config.color},0.03) 100%)`,
        boxShadow: `inset 0 0 0 1px rgba(${config.color},0.3), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(${config.color},0.55) 50%, transparent 100%)`,
        }}
      />
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, rgba(${config.color},0.22) 0%, rgba(${config.color},0.06) 100%)`,
          boxShadow: `inset 0 0 0 1px rgba(${config.color},0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(${config.color},0.45)`,
        }}
      >
        <Icon className="w-4 h-4" style={{ color: config.textColor }} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h3
            className="text-[14px] font-light tracking-[0.005em]"
            style={{ color: config.textColor }}
          >
            {title}
          </h3>
        )}
        <p
          className={`text-[13px] tracking-[0.005em] ${title ? 'mt-1 opacity-90' : ''}`}
          style={{ color: config.textColor }}
        >
          {message}
        </p>
      </div>
      {closeable && onClose && (
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.88 }}
          whileHover={{ rotate: 90 }}
          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
          className="p-1 rounded-md transition-colors flex-shrink-0 hover:bg-white/10"
          style={{ color: config.textColor }}
          aria-label="Close alert"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
};

Alert.displayName = 'Alert';
