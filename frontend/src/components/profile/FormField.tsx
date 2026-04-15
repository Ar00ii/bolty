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
      <label htmlFor={name} className="block text-sm font-light text-text-secondary">
        {label}
        {maxLength && (
          <span className="ml-2 text-xs text-text-muted">
            ({value.length}/{maxLength})
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
        className={`profile-input w-full ${error ? 'border-red-500/50' : success ? 'border-green-500/50' : ''}`}
        rows={isTextarea ? 4 : undefined}
      />
      {error && <p className="form-error">{error}</p>}
      {success && !error && <p className="form-success">Looks good!</p>}
      {helperText && !error && <p className="text-xs text-text-muted">{helperText}</p>}
    </div>
  );
}
