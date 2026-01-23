"use client";

import { useState, useCallback } from "react";
import { ZodSchema, ZodError } from "zod";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationReturn<T> {
  errors: FieldErrors<T>;
  validate: (data: T) => { success: true; data: T } | { success: false; errors: FieldErrors<T> };
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setFieldError: (field: keyof T, message: string) => void;
}

/**
 * Hook for form validation using Zod schemas
 * Works with useState-based forms to provide field-level error messages
 */
export function useFormValidation<T>(
  schema: ZodSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<FieldErrors<T>>({});

  const validate = useCallback(
    (data: T): { success: true; data: T } | { success: false; errors: FieldErrors<T> } => {
      try {
        const validData = schema.parse(data);
        setErrors({});
        return { success: true, data: validData };
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: FieldErrors<T> = {};
          for (const issue of error.issues) {
            const field = issue.path[0] as keyof T;
            if (!fieldErrors[field]) {
              fieldErrors[field] = issue.message;
            }
          }
          setErrors(fieldErrors);
          return { success: false, errors: fieldErrors };
        }
        throw error;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return {
    errors,
    validate,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}
