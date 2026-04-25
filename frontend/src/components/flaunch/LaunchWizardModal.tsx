'use client';

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Rocket,
  Send,
  Sparkles,
  Twitter,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import React, { useState } from 'react';

import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  BOLTY_TREASURY_ADDRESS,
  boltyAttributionFooter,
  isRevenueManagerConfigured,
} from '@/lib/flaunch/config';
import { launchToken, setTokenOverrides } from '@/lib/flaunch/launchpad';
import {
  BOLTY_PROTOCOL_FEE_PERCENT,
  EST_LAUNCH_GAS_USD,
  FLAUNCH_FEE_FREE_THRESHOLD_USD,
  FLAUNCH_LAUNCH_FEE_PERCENT,
  LAUNCH_INITIAL_MARKET_CAP_USD,
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
  /** Path back to the listing, persisted on the token for launchpad filters. */
  listingPath: string;
  /** Render inline (no Modal chrome) when true. The caller provides
   *  its own container + visibility control. Used on the launchpad
   *  page where the form expands inline below the banner row. */
  inline?: boolean;
  /** Launch mode picked in the listing picker. Defaults to 'self'. */
  initialLaunchMode?: 'self' | 'agent';
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
  listingPath,
  inline,
  initialLaunchMode = 'self',
}: LaunchWizardModalProps) {
  if (inline && !open) return null;
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  // Step 1 form
  const [name, setName] = useState(listingTitle);
  const [symbol, setSymbol] = useState(defaultSymbol(listingTitle));
  const [description, setDescription] = useState(
    listingDescription.length > 280
      ? listingDescription.slice(0, 277) + '…'
      : listingDescription,
  );
  // Step 1: user can override the listing image with an upload.
  // Stored as a data: URL (PNG/JPEG/WEBP) so it renders instantly
  // and we can pass straight to the SDK without re-fetching.
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(listingImageUrl);
  /** Wide-format banner for the launchpad carousel. Optional. */
  const [bannerDataUrl, setBannerDataUrl] = useState<string | null>(null);
  // Optional social links — stored in the local override map after
  // launch so they render on the carousel without a tx / IPFS pin.
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  // Step 2 form
  const [creatorShare, setCreatorShare] = useState(80);
  const [premineEth, setPremineEth] = useState('0');
  // Launch mode: 'self' = user signs everything; 'agent' = also
  // auto-posts a community announcement on success. When the listing
  // is an AI_AGENT, we ping its webhook to decide whether to even
  // offer this toggle.
  const [launchMode, setLaunchMode] = useState<'self' | 'agent'>(initialLaunchMode);
  const [agentHealth, setAgentHealth] = useState<
    | { healthy: boolean; latencyMs: number; reason?: string }
    | 'checking'
    | null
  >(null);
  // Step 3 launch state
  const [launchState, setLaunchState] = useState<LaunchState>('idle');
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [result, setResult] = useState<LaunchResult | null>(null);

  // Ping the agent's webhook once the wizard opens so the UI can
  // surface agent-is-down early. Only for AI_AGENT listings.
  React.useEffect(() => {
    if (!open) return;
    if (!listingPath.includes('/agents/')) {
      setAgentHealth(null);
      return;
    }
    let cancelled = false;
    setAgentHealth('checking');
    (async () => {
      try {
        const data = await api.get<{
          healthy: boolean;
          latencyMs: number;
          reason?: string;
        }>(`/market/${listingId}/health`);
        if (!cancelled) setAgentHealth(data);
      } catch {
        if (!cancelled)
          setAgentHealth({ healthy: false, latencyMs: 0, reason: 'check_failed' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, listingPath, listingId]);

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
    setImageDataUrl(listingImageUrl);
    setBannerDataUrl(null);
    setWebsiteUrl('');
    setGithubUrl('');
    setTwitterUrl('');
    setTelegramUrl('');
    setDiscordUrl('');
    setLaunchMode(initialLaunchMode);
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
      // BoltyGuard gate — only when the user picked AI-launch mode.
      // Below 70 we refuse to mint + auto-announce. Self-launch
      // doesn't trigger this; the seller is welcome to launch their
      // own code at their own risk, but we don't broadcast it.
      if (launchMode === 'agent' && listingPath.includes('/agents/')) {
        try {
          const scan = await api
            .get<{ score?: number } | null>(
              `/boltyguard/listings/${listingId}/latest`,
            )
            .catch(() => null);
          if (scan && typeof scan.score === 'number' && scan.score < 70) {
            throw new Error(
              `BoltyGuard blocked the AI launch — security score ${scan.score}/100. Open the agent page, fix the findings, then try again.`,
            );
          }
        } catch (gateErr) {
          if (gateErr instanceof Error && gateErr.message.startsWith('BoltyGuard')) {
            throw gateErr;
          }
          // Network / lookup miss — fail open. The cron + manual
          // review still cover the safety net.
        }
      }
      // Brief "signing" phase before the "pending" on-chain wait.
      await new Promise((r) => setTimeout(r, 700));
      setLaunchState('pending');
      // Race against a 3min ceiling — if the SDK call or the RPC is
      // stuck we want the UI to surface something actionable instead
      // of spinning forever with no feedback.
      const timeoutMs = 180_000;
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                'Launch is taking longer than expected. Check your wallet / network and try again.',
              ),
            ),
          timeoutMs,
        ),
      );
      const launch = launchToken({
        listingId,
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        description:
          description.trim() +
          boltyAttributionFooter(listingUrl, user?.username ?? null),
        imageUrl: imageDataUrl,
        bannerDataUrl,
        websiteUrl: listingUrl,
        listingPath,
        creatorUsername: user?.username ?? null,
        creatorAvatarUrl: user?.avatarUrl ?? null,
        creatorSharePercent: creatorShare,
        premineEth: premineEth || '0',
      });
      const res = await Promise.race([launch, timeout]);
      // Persist social links as overrides keyed by the new token
      // address — they render on the carousel / detail page.
      const anySocial =
        websiteUrl || githubUrl || twitterUrl || telegramUrl || discordUrl;
      if (anySocial && res.tokenAddress) {
        setTokenOverrides(res.tokenAddress, {
          socials: {
            websiteUrl: websiteUrl.trim() || null,
            githubUrl: githubUrl.trim() || null,
            twitterUrl: twitterUrl.trim() || null,
            telegramUrl: telegramUrl.trim() || null,
            discordUrl: discordUrl.trim() || null,
          },
        });
      }
      // AI-launch mode: fire off a community announcement in the
      // background. Non-blocking — if the announce endpoint fails we
      // still treat the launch as successful since the coin is on-chain.
      if (launchMode === 'agent' && res.tokenAddress) {
        api
          .post('/chat/announce-launch', {
            tokenAddress: res.tokenAddress,
            symbol: symbol.trim().toUpperCase(),
            name: name.trim(),
            listingId,
          })
          .catch((err2) => {
            // eslint-disable-next-line no-console
            console.warn('[launchpad] announce failed', err2);
          });
      }
      setResult(res);
      setLaunchState('success');
      onLaunched(res);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[launchpad] launch failed', err);
      setLaunchError(err instanceof Error ? err.message : 'Launch failed');
      setLaunchState('error');
    }
  }

  const body = (
    <>
      {launchState !== 'success' && (
        <StepIndicator step={step} launchState={launchState} />
      )}

      <div className="mt-5 space-y-4">
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
            imageUrl={imageDataUrl}
            onImage={setImageDataUrl}
            bannerUrl={bannerDataUrl}
            onBanner={setBannerDataUrl}
            websiteUrl={websiteUrl}
            onWebsiteUrl={setWebsiteUrl}
            githubUrl={githubUrl}
            onGithubUrl={setGithubUrl}
            twitterUrl={twitterUrl}
            onTwitterUrl={setTwitterUrl}
            telegramUrl={telegramUrl}
            onTelegramUrl={setTelegramUrl}
            discordUrl={discordUrl}
            onDiscordUrl={setDiscordUrl}
          />
        ) : step === 2 ? (
          <Step2Economics
            creatorShare={creatorShare}
            premineEth={premineEth}
            onCreatorShare={setCreatorShare}
            onPremineEth={setPremineEth}
            launchMode={launchMode}
            onLaunchMode={setLaunchMode}
            agentHealth={agentHealth}
            isAgentListing={listingPath.includes('/agents/')}
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
        <div className="mt-6 pt-4 flex items-center justify-between gap-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={step === 1 ? handleClose : () => setStep((s) => (s - 1) as Step)}
            disabled={launchState === 'signing' || launchState === 'pending'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] text-zinc-400 hover:text-white disabled:opacity-40 transition"
          >
            {step === 1 ? 'Cancel' : (<><ArrowLeft className="w-3.5 h-3.5" /> Back</>)}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={step === 1 ? !canContinueFrom1 : !canContinueFrom2}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition disabled:opacity-40 hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.6) 0%, rgba(131,110,249,0.42) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(131,110,249,0.5), 0 4px 20px -8px rgba(131,110,249,0.7)',
              }}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLaunch}
              disabled={launchState === 'signing' || launchState === 'pending'}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition disabled:opacity-70 hover:brightness-110"
              style={{
                background:
                  'linear-gradient(180deg, rgba(131,110,249,0.7) 0%, rgba(131,110,249,0.48) 100%)',
                boxShadow:
                  '0 0 0 1px rgba(131,110,249,0.55), 0 4px 24px -8px rgba(131,110,249,0.8)',
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
    </>
  );

  if (inline) {
    return (
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-[18px] text-white font-medium tracking-tight">
              {launchState === 'success'
                ? 'Token launched'
                : 'Launch a token'}
            </div>
            {launchState !== 'success' && (
              <div className="text-[13px] text-zinc-400 mt-1 font-light">
                Pre-filled from your listing. Tweak anything that should
                differ on-chain. Powered by Flaunch on Base.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="grid place-items-center w-7 h-7 rounded-md text-zinc-500 hover:text-white transition shrink-0 ml-3"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        {body}
      </div>
    );
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
        launchState === 'success' ? undefined : 'Powered by Flaunch · Base'
      }
      size="md"
    >
      {body}
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
    <div className="flex items-center gap-3 text-[11.5px] font-medium tracking-tight">
      {labels.map(([n, label], i) => {
        const active = step === n;
        const done = step > n || (launchState !== 'idle' && n === 3 && launchState === 'success');
        return (
          <React.Fragment key={n}>
            <span
              className="inline-flex items-center gap-2 transition-colors"
              style={{
                color: active ? '#ffffff' : done ? '#b4a7ff' : '#71717a',
              }}
            >
              <span
                className="w-5 h-5 rounded-full grid place-items-center font-mono text-[10.5px] transition"
                style={{
                  background: active
                    ? 'rgba(131,110,249,0.22)'
                    : done
                      ? 'rgba(131,110,249,0.1)'
                      : 'rgba(255,255,255,0.03)',
                  boxShadow: active
                    ? 'inset 0 0 0 1px rgba(131,110,249,0.55), 0 0 0 3px rgba(131,110,249,0.08)'
                    : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                }}
              >
                {n}
              </span>
              {label}
            </span>
            {i < labels.length - 1 && (
              <span
                className="flex-1 h-px transition-colors"
                style={{
                  background: done ? 'rgba(131,110,249,0.35)' : 'rgba(255,255,255,0.06)',
                }}
              />
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
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-[13px] text-white font-medium tracking-tight">
          {label}
        </span>
        {hint && (
          <span className="text-[11.5px] text-zinc-400 font-light tabular-nums">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

// Pure black inputs with soft rounded corners and a clean white border
// on focus. Typography scale lifted so the small helper text stays
// readable — no more cramped tracked uppercase.
const inputCls =
  'w-full px-4 py-3 rounded-2xl text-[14px] text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#836EF9]/50 transition-all';
const inputStyle = {
  background: '#000000',
  border: '1px solid rgba(255,255,255,0.12)',
};

const sectionCls = 'rounded-2xl p-5 space-y-4';
const sectionStyle = {
  background: '#0a0a0c',
  border: '1px solid rgba(255,255,255,0.08)',
};

function Step1Metadata({
  name,
  symbol,
  description,
  onName,
  onSymbol,
  onDescription,
  imageUrl,
  onImage,
  bannerUrl,
  onBanner,
  websiteUrl,
  onWebsiteUrl,
  githubUrl,
  onGithubUrl,
  twitterUrl,
  onTwitterUrl,
  telegramUrl,
  onTelegramUrl,
  discordUrl,
  onDiscordUrl,
}: {
  name: string;
  symbol: string;
  description: string;
  onName: (v: string) => void;
  onSymbol: (v: string) => void;
  onDescription: (v: string) => void;
  imageUrl: string | null;
  onImage: (dataUrl: string | null) => void;
  bannerUrl: string | null;
  onBanner: (dataUrl: string | null) => void;
  websiteUrl: string;
  onWebsiteUrl: (v: string) => void;
  githubUrl: string;
  onGithubUrl: (v: string) => void;
  twitterUrl: string;
  onTwitterUrl: (v: string) => void;
  telegramUrl: string;
  onTelegramUrl: (v: string) => void;
  discordUrl: string;
  onDiscordUrl: (v: string) => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const bannerRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  function pickFile(
    file: File | null,
    opts: { target: 'image' | 'banner'; maxMb: number },
  ) {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setError('Use a PNG, JPG, or WEBP image.');
      return;
    }
    if (file.size > opts.maxMb * 1024 * 1024) {
      setError(`${opts.target === 'banner' ? 'Banner' : 'Image'} must be under ${opts.maxMb} MB.`);
      return;
    }
    // Direct data URL — no cropper. Whatever the user uploads is what
    // goes to the SDK, same way it did before PR #309.
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '') || null;
      if (!url) return;
      if (opts.target === 'banner') onBanner(url);
      else onImage(url);
    };
    reader.onerror = () => setError('Could not read the image file.');
    reader.readAsDataURL(file);
  }

  const socialCount = [websiteUrl, githubUrl, twitterUrl, telegramUrl, discordUrl].filter(Boolean).length;

  const stagger = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] } },
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-5"
    >
      {/* ── LEFT: visual identity (logo + banner) ────────────────────── */}
      <motion.div variants={item} className="space-y-4">
        <div className={sectionCls} style={sectionStyle}>
          <div className="text-[13px] text-white font-medium tracking-tight mb-3">
            Logo
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload token logo"
            className="group relative w-full aspect-square rounded-2xl overflow-hidden transition hover:brightness-110"
            style={{
              background: '#000000',
              border: '1px dashed rgba(255,255,255,0.18)',
            }}
          >
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                <span
                  className="absolute inset-0 grid place-items-center text-[12px] text-white opacity-0 group-hover:opacity-100 transition"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  Change logo
                </span>
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                  <ImageUpIcon />
                  <span className="text-[12px] font-medium">Upload logo</span>
                  <span className="text-[10.5px] font-light text-zinc-600">
                    Square · PNG or JPG
                  </span>
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) =>
                pickFile(e.target.files?.[0] ?? null, { target: 'image', maxMb: 2 })
              }
            />
          </button>
        </div>

        <div className={sectionCls} style={sectionStyle}>
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-[13px] text-white font-medium tracking-tight">
              Banner
            </span>
            <span className="text-[11.5px] text-zinc-400 font-light">Wide 3:1</span>
          </div>
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            aria-label="Upload banner"
            className="group relative block w-full rounded-2xl overflow-hidden transition hover:brightness-110"
            style={{
              aspectRatio: '3 / 1',
              background: '#000000',
              border: '1px dashed rgba(255,255,255,0.18)',
            }}
          >
            {bannerUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
                <span
                  className="absolute inset-0 grid place-items-center text-[11px] text-white opacity-0 group-hover:opacity-100 transition"
                  style={{ background: 'rgba(0,0,0,0.55)' }}
                >
                  Change banner
                </span>
              </>
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-1 text-zinc-500">
                  <ImageUpIcon />
                  <span className="text-[11px] font-medium">Upload banner</span>
                </div>
              </div>
            )}
            <input
              ref={bannerRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) =>
                pickFile(e.target.files?.[0] ?? null, { target: 'banner', maxMb: 4 })
              }
            />
          </button>
        </div>
      </motion.div>

      {/* ── RIGHT: text fields + social links ────────────────────────── */}
      <motion.div variants={item} className="space-y-4">
        <div className={sectionCls} style={sectionStyle}>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_180px] gap-3">
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
            <Field label="Ticker" hint="A–Z, 0–9">
              <input
                value={symbol}
                onChange={(e) =>
                  onSymbol(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8))
                }
                className={inputCls + ' font-mono tracking-wider'}
                style={inputStyle}
                placeholder="TBOT"
                maxLength={8}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Description" hint={`${description.length}/280`}>
              <textarea
                value={description}
                onChange={(e) => onDescription(e.target.value.slice(0, 280))}
                rows={4}
                className={inputCls + ' resize-none leading-relaxed'}
                style={inputStyle}
                placeholder="A short pitch — what is this token for? Why should anyone hold it?"
                maxLength={280}
              />
            </Field>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="rounded-lg px-3 py-2 text-[11.5px] text-red-300 flex items-center gap-2"
              style={{
                background: 'rgba(239,68,68,0.08)',
                boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.25)',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className={sectionCls} style={sectionStyle}>
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-white font-medium tracking-tight">
                Links
              </span>
              {socialCount > 0 && (
                <motion.span
                  key={socialCount}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono tabular-nums text-[#b4a7ff]"
                  style={{
                    background: 'rgba(131,110,249,0.14)',
                    boxShadow: 'inset 0 0 0 1px rgba(131,110,249,0.35)',
                  }}
                >
                  {socialCount}
                </motion.span>
              )}
            </div>
            <span className="text-[11px] text-zinc-500 font-light">All optional</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <SocialInput
              icon={<Globe className="w-4 h-4" />}
              placeholder="Website"
              value={websiteUrl}
              onChange={onWebsiteUrl}
            />
            <SocialInput
              icon={<GithubMark16 />}
              placeholder="GitHub"
              value={githubUrl}
              onChange={onGithubUrl}
            />
            <SocialInput
              icon={<Twitter className="w-4 h-4" />}
              placeholder="X / Twitter"
              value={twitterUrl}
              onChange={onTwitterUrl}
            />
            <SocialInput
              icon={<Send className="w-4 h-4" />}
              placeholder="Telegram"
              value={telegramUrl}
              onChange={onTelegramUrl}
            />
            <SocialInput
              icon={<DiscordMark />}
              placeholder="Discord"
              value={discordUrl}
              onChange={onDiscordUrl}
            />
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}

function ImageUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 16l5-5 4 4 3-3 6 6" />
      <circle cx="9" cy="10" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SocialInput({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl transition focus-within:ring-2 focus-within:ring-[#836EF9]/50"
      style={{
        background: '#000000',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span
        className="shrink-0"
        style={{ color: value ? '#b4a7ff' : '#71717a' }}
      >
        {icon}
      </span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-white placeholder-zinc-600 min-w-0"
      />
    </div>
  );
}

function GithubMark16() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.39v-1.34c-2.23.48-2.7-1.08-2.7-1.08-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.05 1.22.83 1.22.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82A7.66 7.66 0 0 1 8 4.04c.68.01 1.37.1 2.01.28 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.66 3.95.29.25.54.74.54 1.5v2.22c0 .22.15.47.55.39A8 8 0 0 0 8 0Z" />
    </svg>
  );
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.201.36-.435.846-.596 1.228a18.27 18.27 0 0 0-5.924 0A12.64 12.64 0 0 0 9.44 3c-1.301.22-2.56.55-3.76 1.37-2.37 3.53-3.01 6.97-2.69 10.36.005.02.018.04.04.05 1.58 1.16 3.11 1.87 4.62 2.33.01.01.03.01.04 0 .34-.46.64-.95.9-1.46.01-.02 0-.05-.02-.06-.48-.18-.93-.4-1.37-.65-.02-.01-.02-.04 0-.06.09-.07.18-.14.27-.21.02-.01.04-.02.06-.01 2.88 1.32 6 1.32 8.85 0 .02-.01.04 0 .06.01.09.07.18.14.27.21.02.02.02.05 0 .06-.44.26-.89.47-1.37.65-.02.01-.03.04-.02.06.27.51.57 1 .9 1.46.02.01.04.01.05 0 1.52-.46 3.05-1.17 4.63-2.33.02-.01.03-.03.04-.05.39-3.91-.71-7.33-3.01-10.36-.01-.02-.02-.03-.04-.04ZM8.02 12.66c-.9 0-1.65-.83-1.65-1.85 0-1.02.73-1.85 1.65-1.85.93 0 1.66.84 1.65 1.85 0 1.02-.73 1.85-1.65 1.85Zm7.97 0c-.9 0-1.65-.83-1.65-1.85 0-1.02.73-1.85 1.65-1.85.93 0 1.66.84 1.65 1.85 0 1.02-.72 1.85-1.65 1.85Z" />
    </svg>
  );
}

function Step2Economics({
  creatorShare,
  premineEth,
  onCreatorShare,
  onPremineEth,
  launchMode,
  onLaunchMode,
  agentHealth,
  isAgentListing,
}: {
  creatorShare: number;
  premineEth: string;
  onCreatorShare: (v: number) => void;
  onPremineEth: (v: string) => void;
  launchMode: 'self' | 'agent';
  onLaunchMode: (v: 'self' | 'agent') => void;
  agentHealth:
    | { healthy: boolean; latencyMs: number; reason?: string }
    | 'checking'
    | null;
  isAgentListing: boolean;
}) {
  const communityShare = 100 - creatorShare;
  const agentOption =
    isAgentListing &&
    agentHealth !== null &&
    agentHealth !== 'checking' &&
    agentHealth.healthy;
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
          Flaunch charges 1% on every swap. <span className="text-white">Bolty takes 0%</span>{' '}
          — 100% of that fee splits between you and your token&apos;s
          community treasury per the slider above.
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
  const ready = isRevenueManagerConfigured();
  return (
    <div className="space-y-4">
      {!ready && (
        <div
          className="rounded-lg p-3 text-[11.5px] font-light"
          style={{
            background: 'rgba(245,158,11,0.08)',
            boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.3)',
            color: '#fcd34d',
          }}
        >
          <div className="flex items-center gap-1.5 uppercase tracking-[0.12em] text-[10px] font-medium mb-0.5">
            <AlertTriangle className="w-3 h-3" /> Preview mode
          </div>
          <p className="text-zinc-300">
            The launchpad&apos;s protocol contract isn&apos;t deployed on-chain yet, so launches are
            simulated and no real ETH is spent. The UX is final; once the contract is live every
            step below becomes a real Base transaction.
          </p>
        </div>
      )}

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
        <Row label="Starting market cap" value={`$${LAUNCH_INITIAL_MARKET_CAP_USD.toLocaleString()}`} />
        <Row label="Premine" value={`${premineEth || '0'} ETH`} />
        <Row
          label="Flaunch launch fee"
          value={
            LAUNCH_INITIAL_MARKET_CAP_USD < FLAUNCH_FEE_FREE_THRESHOLD_USD
              ? `Free (below $${(FLAUNCH_FEE_FREE_THRESHOLD_USD / 1000).toFixed(0)}k threshold)`
              : `${FLAUNCH_LAUNCH_FEE_PERCENT}% · ~$${((LAUNCH_INITIAL_MARKET_CAP_USD * FLAUNCH_LAUNCH_FEE_PERCENT) / 100).toFixed(2)}`
          }
        />
        <Row
          label="Bolty protocol fee"
          value={
            BOLTY_PROTOCOL_FEE_PERCENT === 0
              ? '0% — 100% of swap fees go to you + community'
              : `${BOLTY_PROTOCOL_FEE_PERCENT}% of swap fees → ${BOLTY_TREASURY_ADDRESS.slice(0, 6)}…${BOLTY_TREASURY_ADDRESS.slice(-4)}`
          }
        />
        <Row label="Network" value="Base (chain 8453)" />
        <Row
          label="You pay"
          value={
            LAUNCH_INITIAL_MARKET_CAP_USD < FLAUNCH_FEE_FREE_THRESHOLD_USD
              ? `Premine + ~$${EST_LAUNCH_GAS_USD.toFixed(2)} gas`
              : `Premine + ~$${((LAUNCH_INITIAL_MARKET_CAP_USD * FLAUNCH_LAUNCH_FEE_PERCENT) / 100 + EST_LAUNCH_GAS_USD).toFixed(2)} (launch fee + gas)`
          }
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
          className="rounded-lg p-3 text-[12.5px] text-red-200 space-y-1.5"
          style={{
            background: 'rgba(239,68,68,0.1)',
            boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.35)',
          }}
        >
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-medium">
            <AlertTriangle className="w-3 h-3" /> Launch failed
          </div>
          <div className="font-mono text-[11.5px] break-words">{launchError}</div>
          <div className="text-[11px] text-zinc-400 font-light">
            Open the browser devtools console for the full stack trace.
            Every stage logs a <span className="font-mono text-zinc-300">[launchpad]</span> line.
          </div>
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

function LaunchModeToggle({
  value,
  onChange,
  agentOption,
  isAgentListing,
  agentHealth,
}: {
  value: 'self' | 'agent';
  onChange: (v: 'self' | 'agent') => void;
  agentOption: boolean;
  isAgentListing: boolean;
  agentHealth:
    | { healthy: boolean; latencyMs: number; reason?: string }
    | 'checking'
    | null;
}) {
  return (
    <Field label="Launch mode">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <ModeOption
          active={value === 'self'}
          onClick={() => onChange('self')}
          title="I'll launch it myself"
          subtitle="You sign the transaction from your wallet. No extras."
        />
        <ModeOption
          active={value === 'agent' && agentOption}
          disabled={!agentOption}
          onClick={() => agentOption && onChange('agent')}
          title="Launch with AI agent"
          subtitle={
            !isAgentListing
              ? 'Only available for AI agent listings.'
              : agentHealth === 'checking'
                ? 'Checking the agent’s webhook…'
                : agentOption
                  ? 'Also posts an announcement to the community feed with the token CA.'
                  : 'Agent is offline. We can’t announce a launch until the webhook responds.'
          }
          badge={
            isAgentListing
              ? agentHealth === 'checking'
                ? { label: 'checking', color: '#a1a1aa' }
                : agentOption
                  ? { label: 'online', color: '#22c55e' }
                  : { label: 'offline', color: '#ef4444' }
              : null
          }
        />
      </div>
    </Field>
  );
}

function ModeOption({
  active,
  disabled,
  onClick,
  title,
  subtitle,
  badge,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  badge?: { label: string; color: string } | null;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="text-left rounded-xl p-3.5 transition disabled:cursor-not-allowed"
      style={{
        background: active
          ? 'linear-gradient(180deg, rgba(131,110,249,0.18) 0%, rgba(131,110,249,0.08) 100%)'
          : 'rgba(255,255,255,0.025)',
        border: active
          ? '1px solid rgba(131,110,249,0.55)'
          : '1px solid rgba(255,255,255,0.07)',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[12.5px] text-white font-medium tracking-tight">
          {title}
        </div>
        {badge && (
          <span
            className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-[0.14em] font-medium px-1.5 py-0.5 rounded-md"
            style={{
              color: badge.color,
              background: 'rgba(255,255,255,0.04)',
              boxShadow: `inset 0 0 0 1px ${badge.color}40`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: badge.color }}
            />
            {badge.label}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11.5px] text-zinc-400 font-light leading-relaxed">
        {subtitle}
      </div>
    </button>
  );
}
