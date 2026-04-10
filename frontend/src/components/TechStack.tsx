'use client';

import { LogoLoop } from '@/components/ui/LogoLoop';

const techLogos = [
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg', alt: 'JavaScript', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', alt: 'Python', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg', alt: 'GitHub', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg', alt: 'Docker', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', alt: 'PostgreSQL', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', alt: 'React', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', alt: 'Node.js', href: '#' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', alt: 'TypeScript', href: '#' },
];

export const TechStack = () => {
  return (
    <div className="relative py-24 w-full">
      {/* Corner brackets */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gray-700 pointer-events-none z-20" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gray-700 pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gray-700 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gray-700 pointer-events-none z-20" />

      <LogoLoop
        logos={techLogos}
        speed={40}
        direction="left"
        logoHeight={200}
        gap={40}
        width="100vw"
        pauseOnHover={true}
        scaleOnHover={true}
        fadeOut={true}
        fadeOutColor="#000000"
        ariaLabel="Bolty technology stack"
      />
    </div>
  );
};
