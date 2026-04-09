'use client';

import { Bot, Zap, Cloud, Code2, Database, Shield } from 'lucide-react';
import { LogoLoop } from '@/components/ui/LogoLoop';

const techLogos = [
  { node: <Bot className="w-8 h-8" />, title: 'AI Agents', href: '#' },
  { node: <Zap className="w-8 h-8" />, title: 'Fast Deployment', href: '#' },
  { node: <Cloud className="w-8 h-8" />, title: 'Cloud Native', href: '#' },
  { node: <Code2 className="w-8 h-8" />, title: 'API First', href: '#' },
  { node: <Database className="w-8 h-8" />, title: 'Data Driven', href: '#' },
  { node: <Shield className="w-8 h-8" />, title: 'Secure', href: '#' },
];

export const TechStack = () => {
  return (
    <div className="relative py-12">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-gray-700 pointer-events-none" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-gray-700 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-gray-700 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-gray-700 pointer-events-none" />

      <LogoLoop
        logos={techLogos}
        speed={80}
        direction="left"
        logoHeight={40}
        gap={60}
        pauseOnHover={true}
        scaleOnHover={true}
        fadeOut={true}
        fadeOutColor="#000000"
        ariaLabel="Bolty technology stack"
      />
    </div>
  );
};
