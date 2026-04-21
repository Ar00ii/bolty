'use client';

import { useCallback, useState } from 'react';

import { ApiError } from '@/lib/api/client';

interface PendingStepUp<T> {
  /** Resolve when the user enters a valid code, reject when they cancel */
  resolve: (code: string) => void;
  reject: (err: Error) => void;
  /** "totp" or "email" — drives the modal copy */
  source: 'totp' | 'email';
  /** Original error so callers can render context */
  message: string;
  /** Carries the original action so we can replay with the code */
  retry: (code: string) => Promise<T>;
}

/**
 * Helper hook for the step-up auth flow. Pattern:
 *
 *   const { runWithStepUp, stepUp, submit, dismiss } = useStepUp();
 *   await runWithStepUp((code) => api.patch('/users/profile', { username, twoFactorCode: code }));
 *
 * The hook calls the action with code=undefined first. If the backend
 * answers with `STEP_UP_REQUIRED`, the modal opens. After the user submits
 * their TOTP, the action is replayed with the code attached.
 */
export function useStepUp<T = unknown>() {
  const [pending, setPending] = useState<PendingStepUp<T> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runWithStepUp = useCallback(async (action: (code?: string) => Promise<T>): Promise<T> => {
    try {
      return await action();
    } catch (err) {
      // Account hasn't enrolled 2FA yet — the only safe response for a
      // sensitive op is to bounce the user to the enrollment page. Coming
      // back from onboarding (?next=...) re-renders the original screen so
      // the user can retry.
      if (err instanceof ApiError && err.code === 'TWO_FACTOR_NOT_ENROLLED') {
        if (typeof window !== 'undefined') {
          const next = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/onboarding/2fa?next=${next}&reason=sensitive`;
        }
        throw err;
      }
      // Accept both the explicit `code` field and older/legacy response shapes
      // where only the message text reaches the client — some proxies strip
      // nested objects and we don't want the modal to silently stay closed.
      const isStepUp =
        err instanceof ApiError &&
        (err.code === 'STEP_UP_REQUIRED' ||
          err.code === 'STEP_UP_INVALID' ||
          (err.status === 400 &&
            typeof err.message === 'string' &&
            /authenticator code/i.test(err.message)));
      if (isStepUp && err instanceof ApiError) {
        return new Promise<T>((resolve, reject) => {
          setPending({
            source: 'totp',
            message: err.message,
            retry: action,
            resolve: (code: string) => {
              action(code)
                .then((r) => {
                  resolve(r);
                  setPending(null);
                })
                .catch((retryErr) => {
                  const retryIsInvalid =
                    retryErr instanceof ApiError &&
                    (retryErr.code === 'STEP_UP_INVALID' ||
                      (retryErr.status === 400 &&
                        typeof retryErr.message === 'string' &&
                        /invalid authenticator|authenticator code/i.test(retryErr.message)));
                  if (retryIsInvalid && retryErr instanceof ApiError) {
                    // Keep modal open with new error message
                    setPending((cur) => (cur ? { ...cur, message: retryErr.message } : cur));
                    return;
                  }
                  reject(retryErr instanceof Error ? retryErr : new Error('Action failed'));
                  setPending(null);
                });
            },
            reject: (e: Error) => {
              reject(e);
              setPending(null);
            },
          });
        });
      }
      throw err;
    }
  }, []);

  const submit = useCallback(
    async (code: string) => {
      if (!pending) return;
      setSubmitting(true);
      try {
        pending.resolve(code);
      } finally {
        setSubmitting(false);
      }
    },
    [pending],
  );

  const dismiss = useCallback(() => {
    if (pending) pending.reject(new Error('Cancelled'));
  }, [pending]);

  return {
    runWithStepUp,
    stepUpOpen: !!pending,
    stepUpMessage: pending?.message,
    stepUpSource: pending?.source ?? 'totp',
    submitting,
    submit,
    dismiss,
  };
}
