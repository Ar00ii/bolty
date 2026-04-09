import { motion } from 'framer-motion';
import React from 'react';
import './AnimatedCard.css';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  index?: number;
}

export const AnimatedCard = ({
  children,
  className = '',
  delay = 0,
  index = 0,
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.5, delay: (index || 0) * 0.1 }}
      className={`animated-card ${className}`}
    >
      <div className="animated-card-border" />
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
