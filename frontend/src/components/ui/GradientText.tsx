import React from 'react';
import './GradientText.css';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  gradient?: 'purple' | 'blue' | 'cyan' | 'pink' | 'rainbow';
  animated?: boolean;
}

export const GradientText = ({
  children,
  className = '',
  gradient = 'purple',
  animated = true,
}: GradientTextProps) => {
  return (
    <span
      className={`gradient-text gradient-text-${gradient} ${animated ? 'gradient-text-animated' : ''} ${className}`}
    >
      {children}
    </span>
  );
};

export default GradientText;
