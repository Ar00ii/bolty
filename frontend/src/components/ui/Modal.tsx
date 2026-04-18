'use client';

import { X } from 'lucide-react';
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  closeOnBackdropClick = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`relative rounded-xl p-6 w-full overflow-hidden ${sizeClasses[size]}`}
        style={{
          background: 'linear-gradient(180deg, rgba(20,20,26,0.95) 0%, rgba(10,10,14,0.95) 100%)',
          boxShadow:
            '0 0 0 1px rgba(131,110,249,0.25), inset 0 1px 0 rgba(255,255,255,0.04), 0 20px 60px -10px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(131,110,249,0.55) 50%, transparent 100%)',
          }}
        />
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-light text-white tracking-[-0.005em]">{title}</h2>
              {subtitle && (
                <p className="text-[13px] text-zinc-400 mt-1 tracking-[0.005em]">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md transition-colors text-zinc-400 hover:text-white hover:bg-white/5"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
