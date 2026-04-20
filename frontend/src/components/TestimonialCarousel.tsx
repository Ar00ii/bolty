'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Bot, Zap, TrendingUp, Quote, type LucideIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  Icon: LucideIcon;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'Easier than large clouds, more feature-rich than single-purpose hosting providers, Bolty lets me ship the entirety of my AI agents in one place.',
    author: 'Mitchell Hashimoto',
    role: 'Co-founder',
    company: 'Marketplace',
    Icon: ShoppingCart,
  },
  {
    quote:
      "The most intuitive platform we've used for deploying AI agents at scale. It just works.",
    author: 'Sarah Chen',
    role: 'Head of Engineering',
    company: 'AI Agents',
    Icon: Bot,
  },
  {
    quote:
      'Zero operational overhead. We went from months of infrastructure setup to live in days.',
    author: 'Alex Rodriguez',
    role: 'Founder & CEO',
    company: 'Zero Ops',
    Icon: Zap,
  },
  {
    quote: 'The analytics capabilities are unmatched. Our insights improved 10x.',
    author: 'James Park',
    role: 'CTO',
    company: 'Analytics',
    Icon: TrendingUp,
  },
  {
    quote: 'Finally, a platform that understands what builders need. Highly recommended.',
    author: 'Elena Vasquez',
    role: 'Product Lead',
    company: 'Bolty',
    Icon: Bot,
  },
];

const ACTIVE_ICON_STYLE = {
  background: 'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.06) 100%)',
  boxShadow:
    'inset 0 0 0 1px rgba(131,110,249,0.38), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px -4px rgba(131,110,249,0.45)',
};

const IDLE_ICON_STYLE = {
  background: 'linear-gradient(135deg, rgba(20,20,26,0.55) 0%, rgba(10,10,14,0.55) 100%)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
};

export const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 120 : -120, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (dir: number) => ({ zIndex: 0, x: dir < 0 ? 120 : -120, opacity: 0 }),
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <div className="space-y-12">
      {/* Company icon row */}
      <div className="flex justify-center items-start gap-8 md:gap-12 flex-wrap">
        {TESTIMONIALS.map((t, idx) => {
          const active = idx === currentIndex;
          const Icon = t.Icon;
          return (
            <motion.button
              key={idx}
              type="button"
              className="group flex flex-col items-center gap-2.5"
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              animate={{ opacity: active ? 1 : 0.55 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              aria-label={`Show testimonial from ${t.company}`}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                style={active ? ACTIVE_ICON_STYLE : IDLE_ICON_STYLE}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${active ? 'text-[#b4a7ff]' : 'text-zinc-400 group-hover:text-zinc-200'}`}
                  strokeWidth={1.75}
                />
              </div>
              <div
                className={`text-[10.5px] uppercase tracking-[0.18em] font-medium transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}
              >
                {t.company}
              </div>
              <motion.div
                className="h-px rounded-full"
                animate={{
                  width: active ? 32 : 12,
                  background: active ? 'rgba(131,110,249,0.7)' : 'rgba(255,255,255,0.15)',
                  boxShadow: active ? '0 0 10px rgba(131,110,249,0.55)' : '0 0 0 rgba(0,0,0,0)',
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Testimonial content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 240, damping: 28 },
            opacity: { duration: 0.3 },
          }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <Quote className="w-7 h-7 text-[#b4a7ff] mx-auto mb-5 opacity-70" strokeWidth={1.5} />

          <p className="text-xl md:text-2xl lg:text-[28px] font-light leading-[1.45] text-white tracking-[-0.005em]">
            {current.quote}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-7 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.06) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.32), 0 0 16px -4px rgba(131,110,249,0.35)',
            }}
          >
            <span className="text-[11.5px] font-medium text-white tracking-[0.02em]">
              {current.author}
            </span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-[11px] text-[#b4a7ff] tracking-[0.02em]">
              {current.role} · {current.company}
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Progress indicators */}
      <div className="flex justify-center gap-1.5 pt-2">
        {TESTIMONIALS.map((_, idx) => {
          const active = idx === currentIndex;
          return (
            <motion.button
              key={idx}
              type="button"
              className="h-1 rounded-full"
              animate={{
                width: active ? 28 : 6,
                background: active ? 'rgba(131,110,249,0.8)' : 'rgba(255,255,255,0.15)',
                boxShadow: active ? '0 0 10px rgba(131,110,249,0.55)' : '0 0 0 rgba(0,0,0,0)',
              }}
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              transition={{ duration: 0.3 }}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
};
