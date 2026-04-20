'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export function LegalPage({
  title,
  icon: Icon,
  lastUpdated,
  sections,
}: {
  title: string;
  icon: LucideIcon;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#000' }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px]"
        style={{
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(131,110,249,0.14), transparent 70%)',
        }}
      />
      <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(135deg, rgba(131,110,249,0.22) 0%, rgba(131,110,249,0.04) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(131,110,249,0.38), 0 0 22px -4px rgba(131,110,249,0.5)',
              }}
            >
              <Icon className="w-5 h-5 text-[#b4a7ff]" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500">
                Bolty
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white leading-none">
                {title}
              </h1>
            </div>
          </div>
          <p className="text-xs text-zinc-500 font-mono">Last updated · {lastUpdated}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
            <p className="text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-3">
              Contents
            </p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-xs text-zinc-400 hover:text-white py-1.5 border-l border-white/[0.06] hover:border-purple-400/40 pl-3 transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </nav>
          </aside>

          <main className="min-w-0 space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-20">
                <h2 className="text-lg sm:text-xl font-light text-white mb-3 tracking-tight">
                  {s.title}
                </h2>
                <div className="text-sm text-zinc-400 leading-relaxed font-light space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-purple-300 [&_a:hover]:text-purple-200">
                  {s.body}
                </div>
              </section>
            ))}

            <footer className="pt-8 mt-10 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-600">
                Not legal advice. Consult a qualified professional if you have questions about your
                specific situation.
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-zinc-700">·</span>
                <Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
                <span className="text-zinc-700">·</span>
                <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
                  Back home
                </Link>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
