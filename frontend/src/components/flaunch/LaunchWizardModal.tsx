'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { launchToken } from '@/lib/flaunch/launchpad';
import {
  BOLTY_PROTOCOL_FEE_PERCENT,
  EST_LAUNCH_GAS_USD,
} from '@/lib/flaunch/feature';
import type { LaunchResult } from '@/lib/flaunch/types';

interface LaunchWizardModalProps {
  open: boolean;
  onClose: () => void;
  onLaunched: (result: LaunchResult) => void;
  /** Pre-fill values from the listing. */
  listingId: string;
  listingTitle: string;
  listingDescription: string;
  listingImageUrl: string | null;
  listingUrl: string;
}

type Step = 1 | 2 | 3;
type LaunchState = 'idle' | 'signing' | 'pending' | 'success' | 'error';

function defaultSymbol(title: string): string {
  return title
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'TOKEN';
}

export function LaunchWizardModal({
  open,
  onClose,
  onLaunched,
  listingId,
  listingTitle,
  listingDescription,
  listingImageUrl,
  listingUrl,
}: LaunchWizardModalProps) {
  const [step, setStep] = useState<Step>(1);
  // Step 1 form
  const [name, setName] = useState(listingTitle);
  const [symbol, setSymbol] = useState(defaultSymbol(listingTitle));
  const [description, setDescription] = useState(
    listingDescription.length > 280
      ? listingDescription.slice(0, 277) + '…'
      : listingDescription,
  );
  // Step 2 form
  const [creatorShare, setCreatorShare] = useState(80);
  const [premineEth, setPremineEth] = useState('0');
  // Step 3 launch state
  const [launchState, setLaunchState] = useState<LaunchState>('idle');
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  function reset() {
    setStep(1);
    setName(listingTitle);
    setSymbol(defaultSymbol(listingTitle));
    setDescription(
      listingDescription.length > 280
        ? listingDescription.slice(0, 277) + '…'
        : listingDescription,
    );
    setCreatorShare(80);
    setPremineEth('0');
    setLaunchState('idle');
    setLaunchError(null);
    setResult(null);
  }

  function handleClose() {
    if (launchState === 'signing' || launchState === 'pending') return;
    onClose();
    // reset after the close animation
    setTimeout(reset, 250);
  }

  const canContinueFrom1 =
    name.trim().length >= 2 &&
    symbol.trim().length >= 2 &&
    symbol.trim().length <= 8 &&
    /^[A-Z0-9]+$/.test(symbol.trim().toUpperCase());

  const premineNum = Number(premineEth) || 0;
  const canContinueFrom2 =
    creatorShare >= 0 &&
    creatorShare <= 100 &&
    premineNum >= 0 &&
    premineNum <= 10;

  async function handleLaunch() {
    setLaunchError(null);
    setLaunchState('signing');
    try {
      // Brief "signing" phase before the "pending" on-chain wait
      await new Promise((r) => setTimeout(r, 700));
      setLaunchState('pending');
      const res = await launchToken({
        listingId,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description: description.trim(),
        imageUrl: listingImageUrl,
        websiteUrl: listingUrl,
        creatorSharePercent: creatorShare,
        premineEth: premineEth || '0',
      });
      setResult(res);
      setLaunchState('success');
      onLaunched(res);
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'Launch failed');
      setLaunchState('error');
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={
        launchState === 'success'
          ? 'Token launched'
          : 'Launch a token for this listing'
      }
      subtitle={
        launchState === 'success'
          ? undefined
          : 'Powered by Flaunch · Base'
      }
      size="md"
    >
      {launchState !== 'success' && (
        <StepIndicator step={step} launchState={launchState} />
      )}

      <div className="mt-4 space-y-4">
        {launchState === 'success' && result ? (
          <SuccessView result={result} symbol={symbol} onClose={handleClose} />
        ) : step === 1 ? (
          <Step1Metadata
            name={name}
            symbol={symbol}
            description={description}
            onName={setName}
            onSymbol={(v) => setSymbol(v.toUpperCase())}
            onDescription={setDescription}
            imageUrl={listingImageUrl}
          />
        ) : step === 2 ? (
          <Step2Economics
            creatorShare={creatorShare}
            premineEth={premineEth}
            onCreatorShare={setCreatorShare}
            onPremineEth={setPremineEth}
          />
        ) : (
          <Step3Review
            name={name}
            symbol={symbol}
            creatorShare={creatorShare}
            premineEth={premineEth}
            launchState={launchState}
            launchError={launchError}
          />
        )}
      </div>

      {launchState !== 'success' && (
        <div className="mt-5 pt-4 flex items-center justify-between gap-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as Step)}
            disabled={launchState === 'signing' || launchState === 'pending'}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] text-zinc-400 hover:text-white disabled:opacity-40 transition"
          >
            {step === 1 ? 'Cancel' : (<><ArrowLeft className="w-3.5 h-3.5" /> Back</>)}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 ? !canContinueFrom1 : !canContinueFrom2}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-light text-white transition disabled:opacity-40"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(131,110,249,0.5), 0 0 20px -8px rgba(131,110,249,0.6)',
              }}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={launchState === 'signing' || launchState === 'pending'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-light text-white transition disabled:opacity-70"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.65) 0%, rgba(131,110,249,0.45) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(131,110,249,0.55), 0 0 24px -8px rgba(131,110,249,0.7)',
              }}
            >
              {launchState === 'signing' || launchState === 'pending' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {launchState === 'signing' ? 'Confirm in wallet…' : 'Launching on Base…'}
                </>
              ) : (
                <>
                  <Rocket className="w-3.5 h-3.5" />
                  Launch token
                </>
              )}
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Sub-views ──────────────────────────────────────────────────────────

function StepIndicator({
  step,
  launchState,
}: {
  step: Step;
  launchState: LaunchState;
}) {
  const labels: Array<[Step, string]> = [
    [1, 'Metadata'],
    [2, 'Economics'],
    [3, 'Launch'],
  ];
  return (
    <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em]">
      {labels.map(([n, label], i) => {
        const active = step === n;
        const done = step > n || (launchState !== 'idle' && n === 3);
        return (
          <React.Fragment key={n}>
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                color: active ? '#ffffff' : done ? '#a78bfa' : '#52525b',
              }}
            >
              <span
                className="w-5 h-5 rounded-full grid place-items-center font-mono text-[10px]"
                style={{
                  background: active
                    ? 'rgba(131,110,249,0.2)'
                    : done
                      ? 'rgba(131,110,249,0.08)'
                      : 'rgba(255,255,255,0.03)',
                  boxShadow: active
                    ? 'inset 0 0 0 1px rgba(131,110,249,0.5)'
                    : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                {n}
              </span>
              {label}
            </span>
            {i < labels.length - 1 && (
              <span className="flex-1 h-px bg-white/[0.06]" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-[0.14em] text-zinc-400">{label}</span>
        {hint && <span className="text-[10.5px] text-zinc-600">{hint}</span>}
      </div>
      {children}
    </label>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg text-[13px] text-white placeholder:text-zinc-600 focus:outline-none';
const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
};

function Step1Metadata({
  name,
  symbol,
  description,
  onName,
  onSymbol,
  onDescription,
  imageUrl,
}: {
  name: string;
  symbol: string;
  description: string;
  onName: (v: string) => void;
  onSymbol: (v: string) => void;
  onDescription: (v: string) => void;
  imageUrl: string | null;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] text-zinc-400 font-light">
        Pre-filled from your listing. Tweak anything that should differ on-chain.
      </p>
      <div className="grid grid-cols-[72px_1fr] gap-3">
        <div
          className="w-[72px] h-[72px] rounded-xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-zinc-600">
              <Sparkles className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Field label="Token name">
            <input
              value={name}
              onChange={(e) => onName(e.target.value.slice(0, 32))}
              className={inputCls}
              style={inputStyle}
              placeholder="Trading Bot"
              maxLength={32}
            />
          </Field>
          <Field label="Ticker" hint="2–8 chars · A-Z, 0-9">
            <input
              value={symbol}
              onChange={(e) => onSymbol(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8))}
              className={inputCls + ' font-mono tracking-wider'}
              style={inputStyle}
              placeholder="TBOT"
              maxLength={8}
            />
          </Field>
        </div>
      </div>
      <Field label="Description" hint={`${description.length}/280`}>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value.slice(0, 280))}
          rows={3}
          className={inputCls + ' resize-none'}
          style={inputStyle}
          placeholder="Short pitch for the token page."
          maxLength={280}
        />
      </Field>
    </div>
  );
}

function Step2Economics({
  creatorShare,
  premineEth,
  onCreatorShare,
  onPremineEth,
}: {
  creatorShare: number;
  premineEth: string;
  onCreatorShare: (v: number) => void;
  onPremineEth: (v: string) => void;
}) {
  const communityShare = 100 - creatorShare;
  return (
    <div className="space-y-4">
      <Field label="Fee split" hint="Immutable after launch">
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={creatorShare}
            onChange={(e) => onCreatorShare(Number(e.target.value))}
            className="w-full accent-purple-400"
          />
          <div className="grid grid-cols-2 gap-2 text-[11.5px] font-light">
            <SplitTile
              label="To you (creator)"
              value={`${creatorShare}%`}
              accent="#836EF9"
            />
            <SplitTile
              label="Community treasury"
              value={`${communityShare}%`}
              accent="#06B6D4"
            />
          </div>
        </div>
      </Field>

      <Field label="Premine (optional)" hint="ETH paid upfront for your own stack">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={10}
            step={0.01}
            value={premineEth}
            onChange={(e) => onPremineEth(e.target.value)}
            className={inputCls + ' font-mono w-32'}
            style={inputStyle}
            placeholder="0"
          />
          <span className="text-[11.5px] text-zinc-500">ETH</span>
        </div>
      </Field>

      <div
        className="rounded-lg p-3 text-[11.5px] font-light text-zinc-400 space-y-1"
        style={{
          background: 'rgba(131,110,249,0.06)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.2)',
        }}
      >
        <div className="flex items-center gap-1.5 text-[#b4a7ff]">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="uppercase tracking-[0.12em] text-[10px] font-medium">Fine print</span>
        </div>
        <div>
          Flaunch charges 1% on every swap. Bolty takes{' '}
          <span className="text-white">{BOLTY_PROTOCOL_FEE_PERCENT}%</span> of that for running the
          launchpad; the rest splits per your slider above.
        </div>
        <div>
          Fair-launch period is 30 min, max buy 0.25% of supply per wallet.
        </div>
      </div>
    </div>
  );
}

function SplitTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: `${accent}10`,
        boxShadow: `inset 0 0 0 1px ${accent}30`,
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">{label}</div>
      <div className="text-[15px] font-light tabular-nums" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}

function Step3Review({
  name,
  symbol,
  creatorShare,
  premineEth,
  launchState,
  launchError,
}: {
  name: string;
  symbol: string;
  creatorShare: number;
  premineEth: string;
  launchState: LaunchState;
  launchError: string | null;
}) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-4 space-y-2"
        style={{
          background:
            'linear-gradient(180deg, rgba(131,110,249,0.08) 0%, rgba(10,10,14,0.4) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.25)',
        }}
      >
        <Row label="Token" value={`${name} (${symbol})`} />
        <Row label="Creator / community" value={`${creatorShare}% / ${100 - creatorShare}%`} />
        <Row label="Premine" value={`${premineEth || '0'} ETH`} />
        <Row label="Bolty protocol fee" value={`${BOLTY_PROTOCOL_FEE_PERCENT}% of swap fees`} />
        <Row label="Network" value="Base (chain 8453)" />
        <Row
          label="You pay"
          value={`Premine + ~$${EST_LAUNCH_GAS_USD.toFixed(2)} gas`}
          highlight
        />
      </div>

      <div className="flex items-start gap-2 text-[11.5px] text-zinc-400 font-light">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
        <div>
          Launches are permanent — the fee split, ticker and supply are immutable once on-chain.
          Gas is paid from your connected wallet.
        </div>
      </div>

      {launchError && (
        <div
          className="rounded-lg p-3 text-[12px] text-red-300"
          style={{
            background: 'rgba(239,68,68,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.3)',
          }}
        >
          {launchError}
        </div>
      )}

      {(launchState === 'signing' || launchState === 'pending') && (
        <div className="flex items-center gap-2 text-[12px] text-[#b4a7ff]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {launchState === 'signing'
            ? 'Check your wallet to sign the transaction.'
            : 'Waiting for Base to confirm…'}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px]">
      <span className="text-zinc-400 font-light">{label}</span>
      <span
        className={highlight ? 'text-white' : 'text-zinc-200'}
        style={{ fontWeight: highlight ? 400 : 300 }}
      >
        {value}
      </span>
    </div>
  );
}

function SuccessView({
  result,
  symbol,
  onClose,
}: {
  result: LaunchResult;
  symbol: string;
  onClose: () => void;
}) {
  const short = `${result.tokenAddress.slice(0, 8)}…${result.tokenAddress.slice(-6)}`;
  return (
    <div className="space-y-4 text-center py-2">
      <div
        className="w-14 h-14 rounded-2xl mx-auto grid place-items-center"
        style={{
          background:
            'linear-gradient(180deg, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.08) 100%)',
          boxShadow:
            '0 0 0 1px rgba(34,197,94,0.35), 0 0 24px -4px rgba(34,197,94,0.55)',
        }}
      >
        <CheckCircle2 className="w-6 h-6 text-[#22c55e]" strokeWidth={1.75} />
      </div>
      <div>
        <div className="text-[15px] text-white font-light">${symbol} is live on Base</div>
        <div className="text-[11.5px] text-zinc-400 font-light mt-1">
          Token tracking appears on the listing in a moment.
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(result.tokenAddress).catch(() => {})}
        className="inline-flex items-center gap-2 mx-auto px-2.5 py-1.5 rounded-lg font-mono text-[11.5px] text-zinc-300 hover:text-white transition"
        style={{
          background: 'rgba(255,255,255,0.04)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <Copy className="w-3 h-3" /> {short}
      </button>
      <div className="flex items-center justify-center gap-2 pt-2">
        <Link
          href={result.flaunchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] text-white transition hover:brightness-110"
          style={{
            background:
              'linear-gradient(180deg, rgba(131,110,249,0.55) 0%, rgba(131,110,249,0.4) 100%)',
            boxShadow: '0 0 0 1px rgba(131,110,249,0.5)',
          }}
        >
          View on Flaunch <ExternalLink className="w-3 h-3" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white transition"
          style={{
            background: 'rgba(255,255,255,0.04)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
