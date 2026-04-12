'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  hint,
  required = false,
  containerClassName = '',
  className = '',
  disabled,
  ...props
}) => {
  const id = props.id || `field-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-white">
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}

      <input
        id={id}
        {...props}
        disabled={disabled}
        className={`
          w-full px-3 py-2 rounded-lg text-sm outline-none
          bg-gray-900 border transition-all duration-200
          text-white placeholder-gray-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'}
          ${className}
        `}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />

      {error && (
        <div id={`${id}-error`} className="flex items-center gap-2 text-sm text-red-400 mt-1">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-gray-500 mt-1">
          {hint}
        </p>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';
