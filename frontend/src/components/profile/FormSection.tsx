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
        <h2 className="text-2xl font-light text-white mb-2">{title}</h2>
        {description && <p className="text-sm text-text-secondary">{description}</p>}
      </div>

      <div className="profile-card">
        <div className="space-y-6">
          {children}
        </div>
      </div>

      {onSubmit && (
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={isLoading || isSaving}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-light text-sm transition-all inline-flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
