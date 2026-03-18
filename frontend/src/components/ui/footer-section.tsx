'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { TwitterIcon, GithubIcon, MessageSquareIcon } from 'lucide-react';
import { BoltyLogo } from '@/components/ui/BoltyLogo';

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    label: 'Product',
    links: [
      { title: 'Community', href: '/chat' },
      { title: 'Marketplace', href: '/market' },
      { title: 'Repositories', href: '/repos' },
      { title: 'AI Assistant', href: '/ai' },
    ],
  },
  {
    label: 'Account',
    links: [
      { title: 'Sign In', href: '/auth' },
      { title: 'Register', href: '/auth?tab=register' },
      { title: 'Profile', href: '/profile' },
      { title: 'Messages', href: '/dm' },
    ],
  },
  {
    label: 'Company',
    links: [
      { title: 'About Bolty', href: '/' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Service', href: '/terms' },
      { title: 'Contact', href: '/chat' },
    ],
  },
  {
    label: 'Social',
    links: [
      { title: '@boltynetwork', href: 'https://x.com/boltynetwork', icon: TwitterIcon, external: true },
      { title: 'GitHub', href: 'https://github.com', icon: GithubIcon, external: true },
      { title: 'Community Chat', href: '/chat', icon: MessageSquareIcon },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative w-full border-t px-6 py-12 lg:py-16" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.98)' }}>
      {/* Top gradient line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/3 rounded-full blur-sm" style={{ background: 'rgba(131,110,249,0.4)' }} />

      <div className="max-w-6xl mx-auto grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        {/* Brand column */}
        <AnimatedContainer className="space-y-4">
          <div className="flex items-center gap-2.5">
            <BoltyLogo size={44} color="#836EF9" />
            <span className="text-white font-bold text-base tracking-tight">Bolty</span>
          </div>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#71717a' }}>
            The developer platform for publishing code, deploying AI agents, and growing your audience.
          </p>
          <p className="text-xs" style={{ color: '#52525b' }}>
            © 2026 Bolty Network. All rights reserved.
          </p>
        </AnimatedContainer>

        {/* Links grid */}
        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.08}>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#836EF9' }}>
                  {section.label}
                </h3>
                <ul className="space-y-2.5 text-sm">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
                          style={{ color: '#71717a' }}
                        >
                          {link.icon && <link.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                          {link.title}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
                          style={{ color: '#71717a' }}
                        >
                          {link.icon && <link.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                          {link.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <>{children}</>;
  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
