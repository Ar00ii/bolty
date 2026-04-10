'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    // Check if element is in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;

          const startTime = Date.now();
          const endTime = startTime + duration * 1000;

          const timer = setInterval(() => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (endTime - startTime), 1);

            // Easing function for smooth animation
            const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
            const easedProgress = easeOutQuad(progress);

            setCount(
              Math.floor(value * easedProgress * Math.pow(10, decimals)) / Math.pow(10, decimals),
            );

            if (progress === 1) {
              clearInterval(timer);
              setCount(value);
            }
          }, 16); // ~60fps

          return () => clearInterval(timer);
        }
      },
      { threshold: 0.5 },
    );

    const div = document.currentScript?.previousElementSibling;
    if (div) observer.observe(div);

    return () => observer.disconnect();
  }, [value, duration, decimals]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={className}
    >
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </motion.span>
  );
}

// Simpler version that always animates
export function CountUp({
  value,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
  delay = 0,
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const timer = setInterval(() => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (endTime - startTime), 1);

      // Easing function
      const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
      const easedProgress = easeOutQuad(progress);

      setCount(Math.floor(value * easedProgress * Math.pow(10, decimals)) / Math.pow(10, decimals));

      if (progress === 1) {
        clearInterval(timer);
        setCount(value);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, decimals]);

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={className}
    >
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </motion.span>
  );
}
