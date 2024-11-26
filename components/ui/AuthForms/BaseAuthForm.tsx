'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface BaseAuthFormProps {
  onSubmit: (formData: FormData) => Promise<{ message?: string } | void>;
  submitText: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function BaseAuthForm({
  onSubmit,
  submitText,
  children,
  footer
}: BaseAuthFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await onSubmit(formData);
      if (result?.message) {
        setSuccess(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-sm space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Success Display */}
        {success && (
          <div className="rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-500">
            {success}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitText}
        </Button>
      </form>

      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}
