'use client';

import { motion } from 'framer-motion';
import React, { useRef } from 'react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles = {
  primary:
    'bg-gradient-to-r from-atlas-500 to-atlas-600 text-white hover:shadow-lg hover:shadow-atlas-500/30',
  secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/15',
  outline: 'border-2 border-atlas-500 text-atlas-400 hover:bg-atlas-500/10',
  ghost: 'text-white hover:bg-white/5',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-2.5 text-base',
  lg: 'px-8 py-3 text-lg',
};

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      className = '',
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const rippleIdRef = useRef(0);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current || (ref as React.RefObject<HTMLButtonElement>).current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const id = rippleIdRef.current++;
      setRipples((prev) => [...prev, { id, x, y }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 600);

      onClick?.(e);
    };

    return (
      <motion.button
        ref={buttonRef}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        onClick={handleClick}
        disabled={disabled || loading}
        className={`
          relative overflow-hidden rounded-lg font-light
          transition-all duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
      >
        {/* Ripples */}
        <div className="absolute inset-0 pointer-events-none">
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full bg-white/30"
              style={{
                width: 8,
                height: 8,
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative flex items-center justify-center gap-2">
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
          )}
          {!loading && icon && <span className="flex items-center">{icon}</span>}
          <span className={loading ? 'opacity-0' : 'opacity-100'}>{children}</span>
        </div>

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
        />
      </motion.button>
    );
  },
);

RippleButton.displayName = 'RippleButton';
