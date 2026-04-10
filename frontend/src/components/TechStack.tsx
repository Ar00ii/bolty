'use client';

import { Code2, Database, Cloud, Zap, Shield, GitBranch } from 'lucide-react';
import { LogoLoop } from '@/components/ui/LogoLoop';

const techLogos = [
  { node: <Code2 className="w-24 h-24" />, title: 'TypeScript', href: '#' },
  { node: <Cloud className="w-24 h-24" />, title: 'Next.js', href: '#' },
  { node: <Database className="w-24 h-24" />, title: 'PostgreSQL', href: '#' },
  { node: <GitBranch className="w-24 h-24" />, title: 'Git', href: '#' },
  { node: <Zap className="w-24 h-24" />, title: 'Redis', href: '#' },
  { node: <Shield className="w-24 h-24" />, title: 'Docker', href: '#' },
];

export const TechStack = () => {
  return (
    <div className="relative py-16">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gray-700 pointer-events-none" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gray-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gray-700 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gray-700 pointer-events-none" />

      <LogoLoop
        logos={techLogos}
        speed={60}
        direction="left"
        logoHeight={120}
        gap={100}
        pauseOnHover={true}
        scaleOnHover={true}
        fadeOut={true}
        fadeOutColor="#000000"
        ariaLabel="Bolty technology stack"
      />
    </div>
  );
};
