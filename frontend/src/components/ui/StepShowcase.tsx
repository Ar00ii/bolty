'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface Step {
  number: string;
  title: string;
  description: string;
}

interface StepShowcaseProps {
  steps: Step[];
  title: string;
}

export function StepShowcase({ steps, title }: StepShowcaseProps) {
  return (
    <div className="space-y-12">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-light text-white"
      >
        {title}
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            className="space-y-4"
          >
            {/* Step number - purple accent */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center font-light text-white text-lg">
              {step.number}
            </div>

            {/* Step content */}
            <div className="space-y-2">
              <h3 className="text-lg font-light text-white">{step.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
