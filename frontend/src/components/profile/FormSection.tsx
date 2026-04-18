'use client';

import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  isLoading?: boolean;
  isSaving?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  onSubmit,
  isLoading,
  isSaving,
}: FormSectionProps) {
  return (
    <form onSubmit={onSubmit} className="profile-form-section space-y-6">
      <div>
        <h2 className="text-2xl font-light text-white mb-2 tracking-[-0.01em]">{title}</h2>
        {description && <p className="text-sm text-zinc-400 tracking-[0.005em]">{description}</p>}
      </div>

      <div className="profile-card">
        <div className="space-y-6">{children}</div>
      </div>

      {onSubmit && (
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading || isSaving}
            className="text-white px-5 py-2.5 rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            style={{
              background:
                'linear-gradient(180deg, rgba(131,110,249,0.38) 0%, rgba(131,110,249,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(131,110,249,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(131,110,249,0.55)',
            }}
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      )}
    </form>
  );
}
