'use client';

import { Loader2, Mail, Shield } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { Modal } from './Modal';

interface VerificationCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void> | void;
  title?: string;
  subtitle?: string;
  /** "email" sends the user-friendly mail copy; "totp" expects an authenticator code */
  source?: 'email' | 'totp';
  length?: number;
}

export function VerificationCodeModal({
  open,
  onClose,
  onSubmit,
  title = 'Confirm with verification code',
  subtitle,
  source = 'email',
  length = 6,
}: VerificationCodeModalProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
      setSubmitting(false);
      // Focus is async so the modal animation can settle first
      const id = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [open]);

  async function handleSubmit() {
    if (code.length < length) {
      setError(`Enter the ${length}-digit code`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(code);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      subtitle={
        subtitle ??
        (source === 'totp'
          ? 'Open your authenticator app and enter the current code.'
          : 'We just emailed you a one-time code. Enter it below to continue.')
      }
      size="sm"
    >
      <div className="space-y-4">
        <div
          className="rounded-lg p-3 flex items-start gap-3"
          style={{
            background: 'rgba(20, 241, 149,0.06)',
            border: '1px solid rgba(20, 241, 149,0.22)',
          }}
        >
          {source === 'totp' ? (
            <Shield className="w-4 h-4 text-bolty-300 flex-shrink-0 mt-0.5" strokeWidth={2} />
          ) : (
            <Mail className="w-4 h-4 text-bolty-300 flex-shrink-0 mt-0.5" strokeWidth={2} />
          )}
          <div className="text-[12px] text-zinc-300 font-semibold leading-snug">
            {source === 'totp'
              ? 'Codes refresh every 30 seconds. Make sure your device clock is correct.'
              : 'The code expires in 10 minutes. Check your spam folder if you cannot find it.'}
          </div>
        </div>

        <div className="flex justify-center">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/[^0-9]/g, '').slice(0, length);
              setCode(next);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSubmit();
            }}
            placeholder={'•'.repeat(length)}
            className="text-center font-mono tracking-[0.5em] text-2xl py-3 rounded-lg w-full bg-transparent text-white outline-none"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              maxWidth: 280,
            }}
            aria-label="Verification code"
          />
        </div>

        {error && <div className="text-[12px] text-red-300 text-center">{error}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg text-[12.5px] text-zinc-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || code.length < length}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition disabled:opacity-50"
            style={{
              color: '#ffffff',
              background:
                'linear-gradient(180deg, rgba(20, 241, 149,0.55) 0%, rgba(20, 241, 149,0.4) 100%)',
              boxShadow: '0 0 0 1px rgba(20, 241, 149,0.5), 0 0 20px -8px rgba(20, 241, 149,0.6)',
            }}
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Verify
          </button>
        </div>
      </div>
    </Modal>
  );
}
