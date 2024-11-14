'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types_db';

/**
 * Props for the BookForm component
 * @param existingBook - The user's existing book data, if any
 */
type Props = {
  existingBook?: Database['public']['Tables']['books']['Row'] | null;
};

/**
 * Book Form Component
 * Handles creation and updates of book details
 * Uses client-side Supabase instance for data mutations
 */
export default function BookForm({ existingBook }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(existingBook?.title || '');
  const [description, setDescription] = useState(
    existingBook?.description || ''
  );
  const [genre, setGenre] = useState<string[]>(existingBook?.genre || []);
  const [targetAudience, setTargetAudience] = useState<string[]>(
    existingBook?.target_audience || []
  );
  const [keywords, setKeywords] = useState<string[]>(
    existingBook?.keywords || []
  );

  /**
   * Handles form submission
   * Creates or updates book in Supabase
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Prepare book data
      const bookData = {
        id: existingBook?.id, // Will be ignored for new books
        author_id: user.id,
        title,
        description,
        genre,
        target_audience: targetAudience,
        keywords,
        updated_at: new Date().toISOString()
      };

      // Update or insert book
      const { error: upsertError } = await supabase
        .from('books')
        .upsert(bookData);

      if (upsertError) throw upsertError;

      // Refresh the page to show updated data
      router.refresh();

      // If this is a new book, go to dashboard
      if (!existingBook) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-200"
        >
          Book Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
          required
        />
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-200"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
          required
        />
      </div>

      {/* Genre Field */}
      <div>
        <label
          htmlFor="genre"
          className="block text-sm font-medium text-zinc-200"
        >
          Genres (comma-separated)
        </label>
        <input
          type="text"
          id="genre"
          value={genre.join(', ')}
          onChange={(e) =>
            setGenre(e.target.value.split(',').map((s) => s.trim()))
          }
          className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
          placeholder="e.g., Business, Self-Help, Technology"
        />
      </div>

      {/* Target Audience Field */}
      <div>
        <label
          htmlFor="audience"
          className="block text-sm font-medium text-zinc-200"
        >
          Target Audience (comma-separated)
        </label>
        <input
          type="text"
          id="audience"
          value={targetAudience.join(', ')}
          onChange={(e) =>
            setTargetAudience(e.target.value.split(',').map((s) => s.trim()))
          }
          className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
          placeholder="e.g., Entrepreneurs, Developers, Marketing Professionals"
        />
      </div>

      {/* Keywords Field */}
      <div>
        <label
          htmlFor="keywords"
          className="block text-sm font-medium text-zinc-200"
        >
          Keywords (comma-separated)
        </label>
        <input
          type="text"
          id="keywords"
          value={keywords.join(', ')}
          onChange={(e) =>
            setKeywords(e.target.value.split(',').map((s) => s.trim()))
          }
          className="mt-1 w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
          placeholder="e.g., startup, technology, marketing"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-500/20 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-white py-2 text-black hover:bg-zinc-200 disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : existingBook ? 'Update Book' : 'Add Book'}
      </button>
    </form>
  );
}
