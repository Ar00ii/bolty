'use client';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import React from 'react';

type MenuItem = {
  label: string;
  href: string;
};

interface MenuVerticalProps {
  menuItems: MenuItem[];
  color?: string;
  skew?: number;
}

const MotionLink = motion.create(Link);

export const MenuVertical = ({
  menuItems = [],
  color = '#836ef9',
  skew = 0,
}: MenuVerticalProps) => {
  return (
    <div className="flex w-fit flex-col gap-4 px-4">
      {menuItems.map((item, index) => (
        <motion.div
          key={`${item.href}-${index}`}
          className="group/nav flex items-center gap-2 cursor-pointer text-[var(--text-muted)]"
          initial="initial"
          whileHover="hover"
        >
          <motion.div
            variants={{
              initial: { x: '-100%', color: 'inherit', opacity: 0 },
              hover: { x: 0, color, opacity: 1 },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="z-0"
          >
            <ArrowRight strokeWidth={3} className="size-8" />
          </motion.div>
          <MotionLink
            href={item.href}
            variants={{
              initial: { x: -32, color: 'inherit' },
              hover: { x: 0, color, skewX: skew },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="font-light text-3xl no-underline"
          >
            {item.label}
          </MotionLink>
        </motion.div>
      ))}
    </div>
  );
};
