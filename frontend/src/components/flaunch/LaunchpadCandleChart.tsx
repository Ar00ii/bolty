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

import { API_URL } from '@/lib/api/client';

// Backend proxy that fronts GeckoTerminal with a Redis cache + a
// stale-fallback. Avoids each browser hammering the public mainnet
// rate limit independently — instead one cache hit per ~30 s feeds
// every viewer of the same coin.
type ProxyCandle = { t: number; o: number; h: number; l: number; c: number };
type ProxyResponse = ProxyCandle[];

/**
 * Candlestick chart for any launchpad token, built the same way as
 * BoltyCandleChart (lightweight-charts + GeckoTerminal OHLCV) but
 * parameterized by token address. The pool lookup + OHLCV fetches go
 * directly to GeckoTerminal's public API from the browser — same
 * endpoints our backend uses for $ATLAS, just called client-side so
 * we don't need a per-token backend proxy.
 *
 * Matches BoltyCandleChart visually so the two charts feel like the
 * same component.
 */

interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
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

const REFRESH_MS = 10_000;

type GeckoOhlcv = {
  data?: {
    attributes?: {
      ohlcv_list?: [number, number, number, number, number, number][];
    };
  };
};

type GeckoPools = {
  data?: Array<{ attributes?: { address?: string } }>;
};

export function LaunchpadCandleChart({
  tokenAddress,
}: {
  tokenAddress: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [poolAddress, setPoolAddress] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES[2]); // 15m default
  const [status, setStatus] = useState<
    'loading' | 'no-pool' | 'ready' | 'empty' | 'error'
  >('loading');

  // Resolve pool address via GeckoTerminal
  useEffect(() => {
    let cancelled = false;
    setPoolAddress(null);
    setStatus('loading');
    fetch(
      `https://api.geckoterminal.com/api/v2/networks/base/tokens/${tokenAddress}/pools`,
    )
      .then((r) => (r.ok ? (r.json() as Promise<GeckoPools>) : null))
      .then((data) => {
        if (cancelled) return;
        const addr = data?.data?.[0]?.attributes?.address ?? null;
        if (addr) {
          setPoolAddress(addr);
        } else {
          setStatus('no-pool');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('no-pool');
      });
    return () => {
      cancelled = true;
    };
  }, [tokenAddress]);

  // Initialize chart once the container mounts
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
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
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
      priceFormat: { type: 'price', precision: 10, minMove: 1e-10 },
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
      if (!poolAddress) return;
      const isInitial = opts.initial ?? false;
      try {
        // Backend proxy (Redis-cached + stale-fallback). Keeps the
        // chart populated through GeckoTerminal rate limits and means
        // one cache hit serves every viewer of the same token.
        const url = `${API_URL}/token/coin/${poolAddress}/ohlcv?timeframe=${timeframe.tf}&aggregate=${timeframe.agg}&limit=300`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) {
          if (!hasDataRef.current) setStatus('error');
          return;
        }
        const data = (await res.json()) as ProxyResponse;
        const rows = Array.isArray(data) ? data : [];
        const series = seriesRef.current;
        if (!series) return;
        if (rows.length === 0) {
          if (!hasDataRef.current) {
            series.setData([]);
            setStatus('empty');
          }
          return;
        }
        // Backend already returns ascending by time, but defensively
        // sort in case of upstream weirdness.
        const candles: Candle[] = rows
          .map(({ t, o, h, l, c }) => ({ t, o, h, l, c }))
          .sort((a, b) => a.t - b.t);
        series.setData(
          candles.map((c) => ({
            time: c.t as Time,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          })),
        );
        hasDataRef.current = true;
        if (isInitial) chartRef.current?.timeScale().fitContent();
        setStatus('ready');
      } catch {
        if (!hasDataRef.current) setStatus('error');
      }
    },
    [poolAddress, timeframe],
  );

  // Refresh on timeframe / pool change + live while tab visible
  useEffect(() => {
    if (!poolAddress) return;
    hasDataRef.current = false;
    setStatus('loading');
    void loadCandles({ initial: true });
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') void loadCandles();
    }, REFRESH_MS);
    return () => clearInterval(interval);
  }, [poolAddress, loadCandles]);

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
              {status === 'no-pool' && 'Waiting for the first trade to index…'}
              {status === 'empty' && 'No candles yet — check back in a minute.'}
              {status === 'error' && 'Could not reach the chart feed.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LaunchpadCandleChart;
