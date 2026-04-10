'use client';

import React from 'react';
import './TechStack.css';

const techLogos = [
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg', alt: 'JavaScript' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg', alt: 'Python' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg', alt: 'GitHub' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg', alt: 'Docker' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg', alt: 'PostgreSQL' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg', alt: 'React' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg', alt: 'Node.js' },
  { src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg', alt: 'TypeScript' },
];

export const TechStack = () => {
  return (
    <div className="tech-stack-container">
      {/* Corner brackets */}
      <div className="corner-bracket top-left" />
      <div className="corner-bracket top-right" />
      <div className="corner-bracket bottom-left" />
      <div className="corner-bracket bottom-right" />

      <div className="tech-stack-carousel">
        <div className="tech-stack-track">
          {/* First set */}
          {techLogos.map((logo, i) => (
            <div key={`first-${i}`} className="tech-stack-item">
              <img src={logo.src} alt={logo.alt} loading="lazy" />
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {techLogos.map((logo, i) => (
            <div key={`second-${i}`} className="tech-stack-item">
              <img src={logo.src} alt={logo.alt} loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
