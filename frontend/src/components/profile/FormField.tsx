'use client';

import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  success?: boolean;
  maxLength?: number;
  isTextarea?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  success,
  maxLength,
  isTextarea,
  helperText,
  disabled,
}: FormFieldProps) {
  const Component = isTextarea ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.18em] font-medium text-zinc-500"
      >
        <span>{label}</span>
        {maxLength && (
          <span className="text-[10.5px] tabular-nums tracking-[0.005em] text-zinc-600 normal-case">
            {value.length}/{maxLength}
          </span>
        )}
      </label>
      <Component
        id={name}
        name={name}
        type={isTextarea ? undefined : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="profile-input w-full px-3 py-2.5 rounded-lg text-white placeholder-zinc-600 focus:outline-none text-[13px] tracking-[0.005em] transition-all focus:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(180deg, rgba(8,8,12,0.8) 0%, rgba(4,4,8,0.8) 100%)',
          boxShadow: error
            ? 'inset 0 0 0 1px rgba(239,68,68,0.5)'
            : success
              ? 'inset 0 0 0 1px rgba(34,197,94,0.5)'
              : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
        rows={isTextarea ? 4 : undefined}
      />
      {error && <p className="form-error text-[12px] text-[#fda4af] tracking-[0.005em]">{error}</p>}
      {success && !error && (
        <p className="form-success text-[12px] text-[#86efac] tracking-[0.005em]">Looks good!</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-zinc-500 tracking-[0.005em]">{helperText}</p>
      )}
    </div>
  );
}
