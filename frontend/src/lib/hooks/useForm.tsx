'use client';

import { useState, useCallback } from 'react';

import { validateForm } from '@/lib/utils/validation';

/** Validator function type for form fields */
export type FieldValidator = (value: unknown) => string | null;

/** Form validation schema type */
export type ValidationSchema<T extends Record<string, unknown>> = Partial<
  Record<keyof T, FieldValidator>
>;

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validationSchema?: ValidationSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  validationSchema,
  onSubmit,
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues((prev) => ({ ...prev, [name]: val }));

      // Real-time validation if schema exists
      if (validationSchema && name in validationSchema) {
        const validator = validationSchema[name as keyof T];
        const error = validator(val);
        setErrors((prev) => ({
          ...prev,
          [name]: error || '',
        }));
      }
    },
    [validationSchema],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError('');

      // Validate all fields
      if (validationSchema) {
        const validationErrors = validateForm(values, validationSchema);
        if (validationErrors.length > 0) {
          const errorMap = validationErrors.reduce(
            (acc, err) => ({ ...acc, [err.field]: err.message }),
            {},
          );
          setErrors(errorMap);
          setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An error occurred';
        setSubmitError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationSchema, onSubmit],
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitError('');
  }, [initialValues]);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
  };
}
