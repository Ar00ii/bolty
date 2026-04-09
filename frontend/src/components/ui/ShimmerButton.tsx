import React from 'react';
import './ShimmerButton.css';

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  as?: 'button' | 'a';
  [key: string]: any;
}

export const ShimmerButton = ({
  children,
  className = '',
  as: Component = 'button',
  ...props
}: ShimmerButtonProps) => {
  return (
    <Component className={`shimmer-button ${className}`} {...props}>
      <span className="shimmer-button-content">{children}</span>
      <span className="shimmer-button-shimmer"></span>
    </Component>
  );
};

export default ShimmerButton;
