'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database } from '@/types_db';

/**
 * Props for the AuthorProfileForm component
 * @param existingProfile - The user's existing profile data, if any
 */
type Props = {
  existingProfile?:
    | Database['public']['Tables']['author_profiles']['Row']
    | null;
};

/**
 * Author Profile Form Component
 * Handles creation and updates of author profiles
 * Uses client-side Supabase instance for data mutations
 */
export default function AuthorProfileForm({ existingProfile }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [bio, setBio] = useState(existingProfile?.bio || '');
  const [expertise, setExpertise] = useState<string[]>(
    existingProfile?.expertise || []
  );
  const [topics, setTopics] = useState<string[]>(
    existingProfile?.target_topics || []
  );

  /**
   * Handles form submission
   * Creates or updates author profile in Supabase
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

      // Prepare profile data
      const profileData = {
        id: user.id,
        bio,
        expertise,
        target_topics: topics,
        updated_at: new Date().toISOString()
      };

      // Update or insert profile
      const { error: upsertError } = await supabase
        .from('author_profiles')
        .upsert(profileData);

      if (upsertError) throw upsertError;

      // Refresh the page to show updated data
      router.refresh();

      // If this is a new profile, go to book setup
      if (!existingProfile) {
        router.push('/onboarding/book');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bio Field */}
      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-zinc-200"
        >
          Bio
        </label>
        <div className="mt-1">
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            required
          />
        </div>
      </div>

      {/* Expertise Field - We'll enhance this with a proper multi-select later */}
      <div>
        <label
          htmlFor="expertise"
          className="block text-sm font-medium text-zinc-200"
        >
          Areas of Expertise (comma-separated)
        </label>
        <div className="mt-1">
          <input
            type="text"
            id="expertise"
            className="w-full rounded-md border-zinc-700 bg-zinc-800 text-white"
            value={expertise.join(', ')}
            onChange={(e) =>
              setExpertise(e.target.value.split(',').map((s) => s.trim()))
            }
            placeholder="e.g., Marketing, Technology, Self-Help"
          />
        </div>
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
        {isLoading
          ? 'Saving...'
          : existingProfile
            ? 'Update Profile'
            : 'Create Profile'}
      </button>
    </form>
  );
}
