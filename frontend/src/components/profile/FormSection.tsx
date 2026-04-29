'use client';

import { motion } from 'framer-motion';
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
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
      className="profile-form-section space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.04, duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <h2 className="text-2xl font-light text-white mb-2 tracking-[-0.01em]">{title}</h2>
        {description && <p className="text-sm text-zinc-400 tracking-[0.005em]">{description}</p>}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
        className="profile-card"
      >
        <div className="space-y-6">{children}</div>
      </motion.div>

      {onSubmit && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
          className="flex justify-end gap-3"
        >
          <motion.button
            type="submit"
            disabled={isLoading || isSaving}
            whileHover={isLoading || isSaving ? undefined : { y: -1 }}
            whileTap={isLoading || isSaving ? undefined : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22 }}
            className="text-white px-5 py-2.5 rounded-lg font-light text-[13px] tracking-[0.005em] transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            style={{
              background:
                'linear-gradient(180deg, rgba(20,241,149,0.38) 0%, rgba(20,241,149,0.14) 100%)',
              boxShadow:
                'inset 0 0 0 1px rgba(20,241,149,0.48), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 22px -4px rgba(20,241,149,0.55)',
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
          </motion.button>
        </motion.div>
      )}
    </motion.form>
  );
}
