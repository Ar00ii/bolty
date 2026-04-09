'use client';

import { AlertCircle } from 'lucide-react';
import { forwardRef, InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, required, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm text-zinc-300 font-light mb-2">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={`w-full px-3 py-2 rounded-lg bg-zinc-900/50 border font-light text-sm transition-all ${
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                : 'border-zinc-700 focus:border-monad-500 focus:ring-1 focus:ring-monad-500/30'
            } text-white placeholder-zinc-600 outline-none ${className}`}
            {...props}
          />
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
          )}
        </div>
        {error && (
          <p className="text-xs text-red-400 font-light mt-1 flex items-center gap-1">{error}</p>
        )}
        {hint && !error && <p className="text-xs text-zinc-500 font-light mt-1">{hint}</p>}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';
