'use client';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import type { ComponentType, SVGProps } from 'react';

interface FaqItem {
  q: string;
  a: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

interface FaqCardStackProps {
  items: FaqItem[];
}

export function FaqCardStack({ items }: FaqCardStackProps) {
  const [cards, setCards] = useState(items.map((item, i) => ({ ...item, id: i })));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 0, 200], [-6, 0, 6]);

  const offset = 14;
  const scaleStep = 0.06;
  const dimStep = 0.22;
  const swipeThreshold = 50;
  const spring = { type: 'spring' as const, stiffness: 200, damping: 28 };

  const moveForward = () => {
    setCards((prev) => [...prev.slice(1), prev[0]]);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const moveBack = () => {
    setCards((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleDragEnd = (
    _: React.PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > 500) {
      if (info.offset.x < 0 || info.velocity.x < 0) {
        setDragDirection('left');
        setTimeout(() => {
          moveForward();
          setDragDirection(null);
        }, 150);
      } else {
        setDragDirection('right');
        setTimeout(() => {
          moveBack();
          setDragDirection(null);
        }, 150);
      }
    }
    dragX.set(0);
  };

  return (
    <div className="relative flex flex-col items-center w-full select-none">
      {/* Card stack */}
      <div className="relative w-full max-w-2xl" style={{ height: '260px', marginBottom: '56px' }}>
        <ul className="relative w-full h-full m-0 p-0">
          <AnimatePresence>
            {cards.slice(0, 4).map(({ id, q, a, icon: Icon }, i) => {
              const isFront = i === 0;
              const brightness = Math.max(0.25, 1 - i * dimStep);
              return (
                <motion.li
                  key={id}
                  className="absolute w-full h-full list-none overflow-hidden rounded-xl border border-dashed"
                  style={{
                    borderColor: isFront ? 'rgba(20,241,149,0.45)' : 'rgba(255,255,255,0.08)',
                    background: isFront
                      ? 'linear-gradient(135deg, rgba(20,241,149,0.07) 0%, rgba(4,4,8,0.98) 100%)'
                      : 'rgba(4,4,8,0.98)',
                    cursor: isFront ? 'grab' : 'default',
                    touchAction: 'none',
                    boxShadow: isFront
                      ? '0 20px 60px rgba(20,241,149,0.12), 0 4px 20px rgba(0,0,0,0.8)'
                      : '0 8px 24px rgba(0,0,0,0.5)',
                    rotate: isFront ? rotate : '0deg',
                  }}
                  animate={{
                    left: `${i * offset}px`,
                    top: `${i * -offset}px`,
                    scale: 1 - i * scaleStep,
                    filter: `brightness(${brightness})`,
                    zIndex: cards.length - i,
                    opacity: dragDirection && isFront ? 0 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={spring}
                  drag={isFront ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDrag={(_e, info) => {
                    if (isFront) dragX.set(info.offset.x);
                  }}
                  onDragEnd={handleDragEnd as never}
                  whileDrag={
                    isFront ? { cursor: 'grabbing', scale: 1.02, zIndex: cards.length + 1 } : {}
                  }
                >
                  {isFront && (
                    <div className="absolute inset-0 p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-[10px] font-mono text-atlas-400 uppercase tracking-widest">
                            {String(currentIndex + 1).padStart(2, '0')} /{' '}
                            {String(items.length).padStart(2, '0')}
                          </p>
                          {Icon && (
                            <Icon
                              className="w-5 h-5 flex-shrink-0 ml-3"
                              style={{ color: '#14F195' }}
                              strokeWidth={1.5}
                            />
                          )}
                        </div>
                        <h3 className="text-lg font-light text-white leading-snug mb-3">{q}</h3>
                      </div>

                      <motion.p
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-zinc-400 text-sm leading-relaxed"
                      >
                        {a}
                      </motion.p>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      </div>

      {/* Navigation row */}
      <div className="flex items-center gap-5">
        <button
          onClick={moveBack}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-800 bg-white/5 text-zinc-400 hover:border-atlas-400/50 hover:text-atlas-400 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex gap-2">
          {items.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'bg-atlas-400 w-6' : 'bg-zinc-700 w-1.5'
              }`}
            />
          ))}
        </div>

        <button
          onClick={moveForward}
          className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-800 bg-white/5 text-zinc-400 hover:border-atlas-400/50 hover:text-atlas-400 transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
