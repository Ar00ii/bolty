export interface ValidationError {
  field: string;
  message: string;
}

export const validators = {
  email: (value: string): string | null => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email address';
  },

  username: (value: string): string | null => {
    if (!value) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be at most 20 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(value))
      return 'Username can only contain letters, numbers, _, and -';
    return null;
  },

  password: (value: string): string | null => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    return null;
  },

  url: (value: string): string | null => {
    if (!value) return 'URL is required';
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL';
    }
  },

  minLength:
    (min: number) =>
    (value: string): string | null => {
      if (!value) return 'This field is required';
      return value.length < min ? `Minimum ${min} characters required` : null;
    },

  maxLength:
    (max: number) =>
    (value: string): string | null => {
      return value.length > max ? `Maximum ${max} characters allowed` : null;
    },

  required: (value: string | number): string | null => {
    return !value || (typeof value === 'string' && !value.trim()) ? 'This field is required' : null;
  },

  number: (value: any): string | null => {
    if (!value) return 'This field is required';
    return isNaN(Number(value)) ? 'Must be a valid number' : null;
  },

  minValue:
    (min: number) =>
    (value: any): string | null => {
      const num = Number(value);
      return isNaN(num) || num < min ? `Value must be at least ${min}` : null;
    },

  maxValue:
    (max: number) =>
    (value: any): string | null => {
      const num = Number(value);
      return isNaN(num) || num > max ? `Value must be at most ${max}` : null;
    },
};

export function validateForm<T extends Record<string, any>>(
  data: T,
  schema: Partial<Record<keyof T, (value: any) => string | null>>,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field in schema) {
    const validator = schema[field];
    if (typeof validator === 'function') {
      const error = validator(data[field]);
      if (error) {
        errors.push({ field, message: error });
      }
    }
  }

  return errors;
}
