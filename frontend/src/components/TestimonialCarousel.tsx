'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  icon: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Easier than large clouds, more feature-rich than single-purpose hosting providers, Render lets me ship the entirety of my projects in one place.",
    author: "MITCHELL HASHIMOTO",
    role: "CO-FOUNDER",
    company: "HASHICORP",
    icon: "●"
  },
  {
    quote: "The most intuitive platform we've used for deploying AI agents at scale. It just works.",
    author: "SARAH CHEN",
    role: "HEAD OF ENGINEERING",
    company: "BASE44",
    icon: "━"
  },
  {
    quote: "Zero operational overhead. We went from months of infrastructure setup to live in days.",
    author: "ALEX RODRIGUEZ",
    role: "FOUNDER & CEO",
    company: "THATCH",
    icon: "□"
  },
  {
    quote: "The automation capabilities are unmatched. Our deployment velocity increased 10x.",
    author: "JAMES PARK",
    role: "CTO",
    company: "PARADIGM",
    icon: "◀"
  },
  {
    quote: "Finally, a platform that understands what builders need. Highly recommended.",
    author: "ELENA VASQUEZ",
    role: "PRODUCT LEAD",
    company: "MONADIC",
    icon: "⊗"
  }
];

export const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <div className="space-y-12">
      {/* Company Icons Row */}
      <div className="flex justify-center items-end gap-12 mb-8 relative">
        {TESTIMONIALS.map((testimonial, idx) => (
          <motion.div
            key={idx}
            className="flex flex-col items-center cursor-pointer"
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            animate={{
              opacity: idx === currentIndex ? 1 : 0.4,
              scale: idx === currentIndex ? 1.1 : 1
            }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon */}
            <div
              className="text-lg mb-3"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {testimonial.icon}
            </div>

            {/* Company Label */}
            <div
              className="text-xs font-light tracking-wider mb-3"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              {testimonial.company}
            </div>

            {/* Active Indicator */}
            <motion.div
              className="w-12 h-px"
              style={{
                backgroundColor: idx === currentIndex
                  ? 'rgba(59, 130, 246, 0.8)'
                  : 'rgba(255,255,255,0.15)'
              }}
              animate={{
                scaleX: idx === currentIndex ? 1 : 1,
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Testimonial Content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          className="text-center space-y-6"
        >
          {/* Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl lg:text-3xl font-light leading-relaxed"
            style={{ color: '#ffffff' }}
          >
            "{current.quote}"
          </motion.p>

          {/* Author Tag */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block px-4 py-2 font-mono text-xs tracking-wide"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            {current.author}, {current.role} OF {current.company}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="flex justify-center gap-2 mt-8">
        {TESTIMONIALS.map((_, idx) => (
          <motion.button
            key={idx}
            className="h-1 rounded-full"
            style={{
              backgroundColor: idx === currentIndex
                ? 'rgba(59, 130, 246, 0.8)'
                : 'rgba(255,255,255,0.2)'
            }}
            animate={{
              width: idx === currentIndex ? 32 : 8
            }}
            onClick={() => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>
    </div>
  );
};
