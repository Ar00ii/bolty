'use client';

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

const alertConfig = {
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-800',
    textColor: 'text-red-300',
    iconColor: 'text-red-400',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-800',
    textColor: 'text-green-300',
    iconColor: 'text-green-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-800',
    textColor: 'text-blue-300',
    iconColor: 'text-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-800',
    textColor: 'text-yellow-300',
    iconColor: 'text-yellow-400',
  },
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
    <div
      className={`p-4 border rounded-lg ${config.bgColor} ${config.borderColor} flex items-start gap-3`}
      role="alert"
    >
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <h3 className={`text-sm font-light ${config.textColor}`}>{title}</h3>}
        <p className={`text-sm ${config.textColor} ${title ? 'mt-1' : ''}`}>{message}</p>
      </div>
      {closeable && onClose && (
        <button
          onClick={onClose}
          className={`p-1 hover:bg-black/20 rounded transition-colors flex-shrink-0 ${config.textColor}`}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';
