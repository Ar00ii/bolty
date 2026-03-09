'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TerminalCard } from '@/components/ui/TerminalCard';
import { useAuth } from '@/lib/auth/AuthProvider';
import { api } from '@/lib/api/client';
import { format } from 'date-fns';

interface PriceData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
}

interface HistoryPoint {
  createdAt: string;
  price: number;
  volume24h?: number;
}

const TIMEFRAMES = [
  { label: '1H', hours: 1 },
  { label: '4H', hours: 4 },
  { label: '24H', hours: 24 },
  { label: '7D', hours: 168 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="terminal-card text-xs p-2 border border-neon-400/30">
      <p className="text-terminal-muted">{label}</p>
      <p className="text-neon-400 font-mono">${payload[0]?.value?.toFixed(8)}</p>
    </div>
  );
};

export default function ChartPage() {
  const { isAuthenticated } = useAuth();
  const [price, setPrice] = useState<PriceData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [timeframe, setTimeframe] = useState(24);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [buyError, setBuyError] = useState('');

  const fetchPrice = useCallback(async () => {
    try {
      const data = await api.get<PriceData>('/chart/price');
      setPrice(data);
    } catch {
      // silent
    }
  }, []);

  const fetchHistory = useCallback(async (hours: number) => {
    setLoading(true);
    try {
      const data = await api.get<HistoryPoint[]>(`/chart/history?hours=${hours}`);
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    fetchHistory(timeframe);

    const priceInterval = setInterval(fetchPrice, 30000);
    return () => clearInterval(priceInterval);
  }, [fetchPrice, fetchHistory, timeframe]);

  const chartData = history.map((p) => ({
    time: format(new Date(p.createdAt), 'HH:mm'),
    price: p.price,
  }));

  const minPrice = Math.min(...chartData.map((p) => p.price)) * 0.999;
  const maxPrice = Math.max(...chartData.map((p) => p.price)) * 1.001;

  // Simulated buy (in production, this integrates with DEX)
  const handleBuy = async () => {
    if (!isAuthenticated) {
      setBuyError('Please connect your wallet first');
      return;
    }
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) {
      setBuyError('Enter a valid amount');
      return;
    }

    setBuyError('');

    // In production: call DEX API (e.g. Jupiter swap)
    // This is a demo showing the UX flow
    setBuyError('');
    setTxHash('');

    try {
      // Simulate transaction
      await new Promise((r) => setTimeout(r, 2000));
      const mockHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(mockHash);
    } catch {
      setBuyError('Transaction failed. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-neon-400 font-mono font-black text-3xl mb-2">BOLTY_TERMINAL</h1>
        <p className="text-terminal-muted text-sm font-mono">
          {'// Real-time price feed'}
        </p>
      </div>

      {/* Price Header */}
      {price && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'PRICE', value: `$${price.price.toFixed(8)}`, highlight: true },
            {
              label: '24H CHANGE',
              value: `${price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}%`,
              positive: price.change24h >= 0,
            },
            {
              label: 'VOLUME 24H',
              value: `$${(price.volume24h / 1e6).toFixed(2)}M`,
            },
            {
              label: 'MARKET CAP',
              value: price.marketCap ? `$${(price.marketCap / 1e6).toFixed(2)}M` : 'N/A',
            },
          ].map((stat) => (
            <TerminalCard key={stat.label} className="text-center">
              <div className="text-terminal-muted text-xs font-mono mb-1">{stat.label}</div>
              <div
                className={`font-mono font-bold text-sm ${
                  stat.highlight
                    ? 'text-neon-glow'
                    : stat.positive === true
                    ? 'text-green-400'
                    : stat.positive === false
                    ? 'text-red-400'
                    : 'text-terminal-text'
                }`}
              >
                {stat.value}
              </div>
            </TerminalCard>
          ))}
        </div>
      )}

      {/* Chart */}
      <TerminalCard title="BOLTY/USD" className="mb-6">
        {/* Timeframe selector */}
        <div className="flex gap-2 mb-4">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.hours}
              onClick={() => setTimeframe(tf.hours)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                timeframe === tf.hours
                  ? 'bg-neon-400/10 text-neon-400 border border-neon-400/30'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-neon-400 font-mono animate-pulse text-sm">
              Loading chart data...
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="neonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39e87c" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#39e87c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[minPrice, maxPrice]}
                tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v.toFixed(6)}`}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#39e87c"
                strokeWidth={1.5}
                fill="url(#neonGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#39e87c', stroke: '#0d1117', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </TerminalCard>

      {/* Buy Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TerminalCard title="buy_bolty">
          {!isAuthenticated ? (
            <div className="text-center py-4">
              <p className="text-terminal-muted text-sm mb-3 font-mono">
                Connect your wallet to buy Bolty
              </p>
              <a href="/auth" className="btn-neon-solid px-6 py-2 rounded text-sm">
                Connect Wallet
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-terminal-muted text-xs font-mono block mb-1">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="terminal-input w-full"
                />
              </div>
              {price && buyAmount && !isNaN(parseFloat(buyAmount)) && (
                <div className="text-xs font-mono text-terminal-muted">
                  ≈{' '}
                  <span className="text-neon-400">
                    {(parseFloat(buyAmount) / price.price).toFixed(0)} BOLTY
                  </span>
                </div>
              )}
              {buyError && (
                <p className="text-red-400 text-xs font-mono">{buyError}</p>
              )}
              {txHash && (
                <div className="bg-neon-400/5 border border-neon-400/30 rounded p-3">
                  <p className="text-neon-400 text-xs font-mono mb-1">Transaction confirmed!</p>
                  <p className="text-terminal-muted text-xs font-mono break-all">{txHash}</p>
                </div>
              )}
              <button
                onClick={handleBuy}
                className="w-full btn-neon-solid py-3 rounded"
              >
                Buy Bolty
              </button>
              <p className="text-terminal-muted text-xs font-mono text-center">
                ⚠ Not financial advice. Trade at your own risk.
              </p>
            </div>
          )}
        </TerminalCard>

        <TerminalCard title="token_info">
          <div className="space-y-3 text-sm font-mono">
            {[
              { label: 'Symbol', value: 'BOLTY' },
              { label: 'Network', value: 'Solana' },
              { label: 'Standard', value: 'SPL Token' },
              { label: 'DEX', value: 'Raydium / Jupiter' },
              { label: 'Contract', value: 'Verify on Solscan' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-terminal-border last:border-0">
                <span className="text-terminal-muted">{item.label}</span>
                <span className="text-neon-400">{item.value}</span>
              </div>
            ))}
          </div>
        </TerminalCard>
      </div>
    </div>
  );
}
