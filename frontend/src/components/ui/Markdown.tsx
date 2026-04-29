'use client';

import React from 'react';

/**
 * Minimal safe Markdown renderer.
 *
 * Supports: headings (# ## ###), bullet lists, fenced code blocks,
 * inline code, **bold**, [text](url) links (http/https/mailto only),
 * paragraphs. Everything else is rendered as plain text — no raw HTML
 * is ever inserted, so it is safe from XSS even if the input is
 * untrusted.
 */

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'code'; lang: string; content: string };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Fenced code
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      blocks.push({ kind: 'code', lang, content: buf.join('\n') });
      continue;
    }
    // Heading
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      blocks.push({
        kind: 'heading',
        level: h[1].length as 1 | 2 | 3,
        text: h[2].trim(),
      });
      i++;
      continue;
    }
    // List
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'list', items });
      continue;
    }
    // Blank
    if (!line.trim()) {
      i++;
      continue;
    }
    // Paragraph: collect until blank or block marker
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ kind: 'paragraph', text: para.join(' ') });
  }
  return blocks;
}

function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:';
  } catch {
    return false;
  }
}

function renderInline(text: string): React.ReactNode[] {
  // Tokenize: inline code (`...`), bold (**...**), links ([text](url))
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/;
  while (rest.length > 0) {
    const m = rest.match(pattern);
    if (!m || m.index === undefined) {
      nodes.push(rest);
      break;
    }
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    const token = m[0];
    if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded-md text-[#b4a7ff] text-[0.85em] font-mono"
          style={{
            background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
            boxShadow: 'inset 0 0 0 1px rgba(20,241,149,0.2)',
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="font-medium text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link && isSafeUrl(link[2])) {
        nodes.push(
          <a
            key={key++}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#b4a7ff] hover:text-white underline underline-offset-2 transition-colors"
          >
            {link[1]}
          </a>,
        );
      } else if (link) {
        nodes.push(link[1]);
      }
    }
    rest = rest.slice(m.index + token.length);
  }
  return nodes;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const blocks = parseBlocks(source);
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.kind === 'heading') {
          const sizes = {
            1: 'text-xl font-light text-white mt-6 mb-3 tracking-[-0.01em]',
            2: 'text-lg font-light text-white mt-5 mb-2 tracking-[-0.005em]',
            3: 'text-base font-light text-zinc-100 mt-4 mb-2',
          } as const;
          return (
            <div key={i} className={sizes[b.level]}>
              {renderInline(b.text)}
            </div>
          );
        }
        if (b.kind === 'list') {
          return (
            <ul
              key={i}
              className="list-disc list-outside pl-5 my-3 space-y-1.5 text-[13px] text-zinc-300 tracking-[0.005em] marker:text-[#b4a7ff]"
            >
              {b.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (b.kind === 'code') {
          return (
            <pre
              key={i}
              className="relative my-3 rounded-lg p-3 overflow-x-auto text-[12px] font-mono text-zinc-200"
              style={{
                background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
              }}
            >
              {b.lang && (
                <div className="text-[10px] uppercase tracking-[0.18em] font-medium text-zinc-500 mb-2">
                  {b.lang}
                </div>
              )}
              <code>{b.content}</code>
            </pre>
          );
        }
        return (
          <p key={i} className="my-3 text-[13px] leading-relaxed text-zinc-300 tracking-[0.005em]">
            {renderInline(b.text)}
          </p>
        );
      })}
    </div>
  );
}
