'use client';

import { Globe, Image as ImageIcon, Loader2, Send, Twitter, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { setTokenOverrides, uploadDataUrlToPinata } from '@/lib/flaunch/launchpad';
import type { TokenInfo } from '@/lib/flaunch/types';

/**
 * Post-launch editor for the token owner. Edits banner + logo + social
 * links, writes to local overrides (merged back into TokenInfo by the
 * launchpad read boundary). Images go through Pinata; if the JWT isn't
 * configured we fall back to the raw data URL so the UI still shows
 * the change in the current session.
 */

export function EditTokenModal({
  open,
  token,
  onClose,
  onSaved,
}: {
  open: boolean;
  token: TokenInfo | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [bannerDataUrl, setBannerDataUrl] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !open) return;
    setLogoDataUrl(null);
    setBannerDataUrl(null);
    setWebsiteUrl(token.socials?.websiteUrl ?? '');
    setGithubUrl(token.socials?.githubUrl ?? '');
    setTwitterUrl(token.socials?.twitterUrl ?? '');
    setTelegramUrl(token.socials?.telegramUrl ?? '');
    setDiscordUrl(token.socials?.discordUrl ?? '');
    setError(null);
  }, [token, open]);

  if (!open || !token) return null;

  async function pickFile(
    file: File | undefined,
    target: 'logo' | 'banner',
    maxMb: number,
  ) {
    if (!file) return;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`${target} too big — max ${maxMb}MB`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null;
      if (!url) return;
      if (target === 'logo') setLogoDataUrl(url);
      else setBannerDataUrl(url);
    };
    reader.readAsDataURL(file);
  }

  async function onSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      let newImageUrl: string | null | undefined;
      let newBannerUrl: string | null | undefined;
      if (logoDataUrl) {
        const uploaded = await uploadDataUrlToPinata(logoDataUrl, {
          name: `${token.symbol}-logo`,
          kind: 'logo',
        }).catch(() => null);
        newImageUrl = uploaded ?? logoDataUrl;
      }
      if (bannerDataUrl) {
        const uploaded = await uploadDataUrlToPinata(bannerDataUrl, {
          name: `${token.symbol}-banner`,
          kind: 'banner',
        }).catch(() => null);
        newBannerUrl = uploaded ?? bannerDataUrl;
      }
      setTokenOverrides(token.tokenAddress, {
        ...(newImageUrl !== undefined ? { imageUrl: newImageUrl } : {}),
        ...(newBannerUrl !== undefined ? { bannerUrl: newBannerUrl } : {}),
        socials: {
          websiteUrl: websiteUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
          twitterUrl: twitterUrl.trim() || null,
          telegramUrl: telegramUrl.trim() || null,
          discordUrl: discordUrl.trim() || null,
        },
      });
      window.dispatchEvent(new CustomEvent('launchpad:refresh'));
      onSaved?.();
      onClose();
    } catch (e) {
      setError((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0c0c10',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="text-[14px] text-white font-light">Edit token</div>
            <div className="text-[11px] text-zinc-500 font-mono tabular-nums mt-0.5">
              ${token.symbol}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid place-items-center w-7 h-7 rounded-md text-zinc-500 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <ImagePickerRow
            label="Logo"
            hint="Square. PNG or JPG. Max 2MB."
            preview={logoDataUrl ?? token.imageUrl}
            onPick={(f) => pickFile(f, 'logo', 2)}
            aspect="square"
          />

          <ImagePickerRow
            label="Banner"
            hint="Wide 3:1. PNG or JPG. Max 4MB."
            preview={bannerDataUrl ?? token.bannerUrl}
            onPick={(f) => pickFile(f, 'banner', 4)}
            aspect="banner"
          />

          <div className="space-y-2">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-zinc-500 font-medium">
              Links
            </div>
            <LinkInput
              icon={<Globe className="w-3.5 h-3.5" />}
              placeholder="https://…"
              value={websiteUrl}
              onChange={setWebsiteUrl}
            />
            <LinkInput
              icon={<GithubIcon />}
              placeholder="https://github.com/…"
              value={githubUrl}
              onChange={setGithubUrl}
            />
            <LinkInput
              icon={<Twitter className="w-3.5 h-3.5" />}
              placeholder="https://x.com/…"
              value={twitterUrl}
              onChange={setTwitterUrl}
            />
            <LinkInput
              icon={<Send className="w-3.5 h-3.5" />}
              placeholder="https://t.me/…"
              value={telegramUrl}
              onChange={setTelegramUrl}
            />
            <LinkInput
              icon={<DiscordIcon />}
              placeholder="https://discord.gg/…"
              value={discordUrl}
              onChange={setDiscordUrl}
            />
          </div>

          {error && (
            <div
              className="rounded-md px-3 py-2 text-[11.5px] text-red-300"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-[12px] text-zinc-300 hover:text-white transition"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] text-white transition hover:brightness-110 disabled:opacity-60"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,241,149,0.55) 0%, rgba(20,241,149,0.4) 100%)',
              boxShadow:
                '0 0 0 1px rgba(20,241,149,0.5), 0 0 20px -8px rgba(20,241,149,0.6)',
            }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>

    </div>
  );
}

function ImagePickerRow({
  label,
  hint,
  preview,
  onPick,
  aspect,
}: {
  label: string;
  hint: string;
  preview: string | null;
  onPick: (file: File | undefined) => void;
  aspect: 'square' | 'banner';
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`shrink-0 rounded-lg overflow-hidden grid place-items-center text-zinc-500 hover:text-white transition ${
          aspect === 'square' ? 'w-16 h-16' : 'w-32 h-12'
        }`}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.12)',
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-4 h-4" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-white font-light">{label}</div>
        <div className="text-[10.5px] text-zinc-500 mt-0.5">{hint}</div>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

function LinkInput({
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
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        background: 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span className="text-zinc-500 shrink-0">{icon}</span>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[12.5px] text-white placeholder-zinc-600 min-w-0 font-mono"
      />
    </div>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.39v-1.34c-2.23.48-2.7-1.08-2.7-1.08-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.05 1.22.83 1.22.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82A7.66 7.66 0 0 1 8 4.04c.68.01 1.37.1 2.01.28 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.66 3.95.29.25.54.74.54 1.5v2.22c0 .22.15.47.55.39A8 8 0 0 0 8 0Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden>
      <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.201.36-.435.846-.596 1.228a18.27 18.27 0 0 0-5.924 0A12.64 12.64 0 0 0 9.44 3c-1.301.22-2.56.55-3.76 1.37-2.37 3.53-3.01 6.97-2.69 10.36.005.02.018.04.04.05 1.58 1.16 3.11 1.87 4.62 2.33.01.01.03.01.04 0 .34-.46.64-.95.9-1.46.01-.02 0-.05-.02-.06-.48-.18-.93-.4-1.37-.65-.02-.01-.02-.04 0-.06.09-.07.18-.14.27-.21.02-.01.04-.02.06-.01 2.88 1.32 6 1.32 8.85 0 .02-.01.04 0 .06.01.09.07.18.14.27.21.02.02.02.05 0 .06-.44.26-.89.47-1.37.65-.02.01-.03.04-.02.06.27.51.57 1 .9 1.46.02.01.04.01.05 0 1.52-.46 3.05-1.17 4.63-2.33.02-.01.03-.03.04-.05.39-3.91-.71-7.33-3.01-10.36-.01-.02-.02-.03-.04-.04ZM8.02 12.66c-.9 0-1.65-.83-1.65-1.85 0-1.02.73-1.85 1.65-1.85.93 0 1.66.84 1.65 1.85 0 1.02-.73 1.85-1.65 1.85Zm7.97 0c-.9 0-1.65-.83-1.65-1.85 0-1.02.73-1.85 1.65-1.85.93 0 1.66.84 1.65 1.85 0 1.02-.72 1.85-1.65 1.85Z" />
    </svg>
  );
}
