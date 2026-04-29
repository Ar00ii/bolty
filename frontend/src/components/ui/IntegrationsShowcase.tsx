'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface Integration {
  name: string;
  icon: LucideIcon;
}

interface IntegrationsShowcaseProps {
  title: string;
  integrations: Integration[];
}

export function IntegrationsShowcase({ title, integrations }: IntegrationsShowcaseProps) {
  return (
    <div className="space-y-8">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-light text-white"
      >
        {title}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-4 md:grid-cols-6 gap-4"
      >
        {integrations.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="group relative"
            >
              <div className="aspect-square rounded-lg bg-gradient-to-br from-atlas-500/30 to-atlas-600/20 border border-atlas-500/20 flex items-center justify-center transition-all duration-300 hover:border-atlas-500/40 hover:from-atlas-500/40 hover:to-atlas-600/30">
                <Icon
                  className="w-6 h-6 text-atlas-300 group-hover:text-atlas-200 transition-colors"
                  strokeWidth={1.5}
                />
              </div>
              <div className="absolute inset-0 rounded-lg bg-atlas-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg -z-10" />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
