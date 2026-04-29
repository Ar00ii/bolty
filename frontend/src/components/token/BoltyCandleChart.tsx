'use client';

import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { api } from '@/lib/api/client';

interface Candle {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

type Timeframe = { label: string; tf: 'minute' | 'hour' | 'day'; agg: number };

const TIMEFRAMES: Timeframe[] = [
  { label: '1m', tf: 'minute', agg: 1 },
  { label: '5m', tf: 'minute', agg: 5 },
  { label: '15m', tf: 'minute', agg: 15 },
  { label: '1h', tf: 'hour', agg: 1 },
  { label: '4h', tf: 'hour', agg: 4 },
  { label: '1D', tf: 'day', agg: 1 },
];

const REFRESH_MS = 8000;

/** Render an app-style candlestick chart fed from our backend proxy. */
export function BoltyCandleChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  // Default to 1h candles — for a low-volume token like $ATLAS, the
  // 1m view often looks like a flat line with one or two random ticks.
  // 1h aggregates enough trades for the chart to actually have shape
  // on first paint. The label-based lookup keeps this resilient if the
  // TIMEFRAMES array is reordered later.
  const [timeframe, setTimeframe] = useState<Timeframe>(
    () => TIMEFRAMES.find((t) => t.label === '1h') ?? TIMEFRAMES[0],
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading',
  );

  // Initialize chart once the container mounts.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.55)',
        fontFamily: 'inherit',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: 'rgba(20,241,149,0.35)', width: 1, style: 0 },
        horzLine: { color: 'rgba(20,241,149,0.35)', width: 1, style: 0 },
      },
      autoSize: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#4ADE80',
      downColor: '#FB7185',
      wickUpColor: '#4ADE80',
      wickDownColor: '#FB7185',
      borderVisible: false,
      priceFormat: { type: 'price', precision: 8, minMove: 0.00000001 },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  const hasDataRef = useRef(false);

  const loadCandles = useCallback(
    async (opts: { initial?: boolean } = {}) => {
      const isInitial = opts.initial ?? false;
      try {
        const data = await api.get<Candle[]>(
          `/token/bolty/ohlcv?timeframe=${timeframe.tf}&aggregate=${timeframe.agg}&limit=300`,
        );
        const series = seriesRef.current;
        if (!series) return;
        if (!data || data.length === 0) {
          // On a refresh with an empty response (rate-limit, flaky
          // upstream, cache miss racing with an upstream purge), keep
          // the candles we already have — only show the empty state
          // if we've literally never had data.
          if (!hasDataRef.current) {
            series.setData([]);
            setStatus('empty');
          }
          return;
        }
        series.setData(
          data.map((c) => ({
            time: c.t as Time,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          })),
        );
        hasDataRef.current = true;
        // Only fit on the initial load (or on timeframe switch). Fitting
        // on every refresh resets the user's pan/zoom — ugly.
        if (isInitial) chartRef.current?.timeScale().fitContent();
        setStatus('ready');
      } catch {
        // Ignore transient fetch errors on refresh — keep the chart.
        if (!hasDataRef.current) setStatus('error');
      }
    },
    [timeframe],
  );

  // Reload on timeframe change + live refresh while the tab is visible.
  useEffect(() => {
    // New timeframe invalidates the prior candle set, so reset the
    // "have data" flag — that way if the first fetch on the new
    // timeframe comes back empty we can still show the overlay.
    hasDataRef.current = false;
    setStatus('loading');
    void loadCandles({ initial: true });
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadCandles();
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadCandles]);

  const tfButtons = useMemo(
    () =>
      TIMEFRAMES.map((t) => ({
        ...t,
        active: t.label === timeframe.label,
      })),
    [timeframe],
  );

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.22em] text-white/40">
            Chart
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-[1px] text-[10px] text-emerald-300">
            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5">
          {tfButtons.map((t) => (
            <button
              key={t.label}
              onClick={() => setTimeframe(t)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-normal transition ${
                t.active
                  ? 'bg-white/15 text-white shadow-inner'
                  : 'text-white/55 hover:bg-white/5 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="relative flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        {status !== 'ready' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-xl bg-black/60 px-3 py-1.5 text-[11px] text-white/60 backdrop-blur">
              {status === 'loading' && 'Loading candles…'}
              {status === 'empty' && 'No candles yet — check back in a minute.'}
              {status === 'error' && 'Couldn’t reach the chart feed.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BoltyCandleChart;
