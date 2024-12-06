'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' }
] as const;

export default function CreateTicketForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    try {
      const supabase = createClient();

      // Get the current user
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('User error:', userError);
        throw new Error('Authentication error: ' + userError.message);
      }

      if (!user) {
        throw new Error('You must be logged in to create a ticket');
      }

      // Log the data we're about to send
      console.log('Submitting ticket:', {
        title,
        description,
        category,
        user_id: user.id
      });

      const { data, error: submitError } = await supabase
        .from('support_tickets')
        .insert([
          {
            title,
            description,
            category,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (submitError) {
        console.error('Submit error:', submitError);
        throw new Error(submitError.message);
      }

      console.log('Ticket created:', data);
      router.push('/help/tickets');
      router.refresh();
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create ticket. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="title"
          className="text-sm font-medium leading-none text-zinc-300"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          placeholder="Brief description of your issue"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="category"
          className="text-sm font-medium leading-none text-zinc-300"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-100 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        >
          <option value="">Select a category</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="description"
          className="text-sm font-medium leading-none text-zinc-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          placeholder="Detailed explanation of your issue"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:bg-blue-500/50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
      </button>
    </form>
  );
}
