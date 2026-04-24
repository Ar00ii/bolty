'use client';

import React, { useMemo, useState } from 'react';

/**
 * Larger SVG price chart for the token detail panel. Takes the same
 * 7-daily-point data our cards use — upgraded with axes, gridlines,
 * a hover crosshair, and a tooltip-on-hover.
 *
 * Phase 2.next can swap to a real OHLC dataset once we wire up an
 * hourly price history source (subgraph or backend mirror). The
 * component API stays identical — pass `data` and done.
 */

interface Props {
  data: number[];
  /** Optional human labels for each point (e.g. "6d ago", "now"). */
  labels?: string[];
  height?: number;
  className?: string;
}

export function TokenPriceChart({ data, labels, height = 220, className }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const padL = 48;
  const padR = 12;
  const padT = 12;
  const padB = 24;

  const derived = useMemo(() => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return { min, max, range };
  }, [data]);

  if (!derived) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
        }}
      >
        No price history yet
      </div>
    );
  }

  const { min, max, range } = derived;
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? '#22c55e' : '#ef4444';
  const fillTop = up ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)';
  const fillBot = 'rgba(0,0,0,0)';
  const gradId = 'mk-price-area-' + (up ? 'u' : 'd');

  return (
    <svg
      className={className}
      viewBox={`0 0 400 ${height}`}
      preserveAspectRatio="none"
      role="img"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
        const xNorm = (e.clientX - rect.left) / rect.width;
        const step = 1 / (data.length - 1);
        const idx = Math.max(0, Math.min(data.length - 1, Math.round(xNorm / step)));
        setHover(idx);
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillTop} />
          <stop offset="100%" stopColor={fillBot} />
        </linearGradient>
      </defs>

      {/* Horizontal gridlines + y-axis labels */}
      {Array.from({ length: 4 }).map((_, i) => {
        const y = padT + ((height - padT - padB) / 3) * i;
        const v = max - (range / 3) * i;
        return (
          <g key={i}>
            <line
              x1={padL}
              x2={400 - padR}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray={i === 3 ? '' : '3 4'}
            />
            <text
              x={padL - 8}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="rgba(161,161,170,0.7)"
              fontFamily="ui-monospace, monospace"
            >
              {formatAxisValue(v)}
            </text>
          </g>
        );
      })}

      {/* Area + line */}
      {(() => {
        const innerW = 400 - padL - padR;
        const innerH = height - padT - padB;
        const step = innerW / (data.length - 1);
        const points = data.map((v, i) => {
          const x = padL + i * step;
          const y = padT + (1 - (v - min) / range) * innerH;
          return [x, y] as const;
        });
        const linePath = points
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
          .join(' ');
        const areaPath = `${linePath} L${padL + innerW},${padT + innerH} L${padL},${padT + innerH} Z`;
        return (
          <>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path
              d={linePath}
              fill="none"
              stroke={stroke}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
            {/* Dots at each point */}
            {points.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={1.5} fill={stroke} />
            ))}

            {/* Hover crosshair + tooltip */}
            {hover !== null && points[hover] && (
              <g>
                <line
                  x1={points[hover][0]}
                  x2={points[hover][0]}
                  y1={padT}
                  y2={padT + innerH}
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={points[hover][0]}
                  cy={points[hover][1]}
                  r={3.5}
                  fill={stroke}
                  stroke="#09090b"
                  strokeWidth={1.5}
                />
                {/* Tooltip */}
                <g
                  transform={`translate(${Math.max(
                    padL,
                    Math.min(400 - padR - 90, points[hover][0] - 45),
                  )}, ${padT + 4})`}
                >
                  <rect
                    x={0}
                    y={0}
                    width={90}
                    height={32}
                    rx={6}
                    fill="#09090b"
                    stroke="rgba(255,255,255,0.12)"
                  />
                  <text
                    x={8}
                    y={13}
                    fontSize="9"
                    fontFamily="ui-monospace, monospace"
                    fill="rgba(161,161,170,0.7)"
                  >
                    {(labels?.[hover] ?? `Day ${hover + 1}`).toUpperCase()}
                  </text>
                  <text
                    x={8}
                    y={26}
                    fontSize="11"
                    fontFamily="ui-monospace, monospace"
                    fill="#ffffff"
                  >
                    {formatAxisValue(data[hover])}
                  </text>
                </g>
              </g>
            )}
          </>
        );
      })()}

      {/* X-axis labels (first + last) */}
      <text
        x={padL}
        y={height - 6}
        fontSize="9"
        fill="rgba(161,161,170,0.6)"
        fontFamily="ui-monospace, monospace"
      >
        {labels?.[0] ?? '7d ago'}
      </text>
      <text
        x={400 - padR}
        y={height - 6}
        textAnchor="end"
        fontSize="9"
        fill="rgba(161,161,170,0.6)"
        fontFamily="ui-monospace, monospace"
      >
        {labels?.[labels.length - 1] ?? 'now'}
      </text>
    </svg>
  );
}

function formatAxisValue(v: number): string {
  if (v >= 1000) return v.toFixed(0);
  if (v >= 10) return v.toFixed(1);
  if (v >= 0.01) return v.toFixed(2);
  if (v >= 0.0001) return v.toFixed(4);
  return v.toExponential(1);
}
