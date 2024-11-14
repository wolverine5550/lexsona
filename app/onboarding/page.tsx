import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

/**
 * Main onboarding page component.
 * Shows the steps needed to complete the author profile setup.
 * Tracks progress and guides users through the onboarding flow.
 */
export default async function OnboardingPage() {
  // Create server-side Supabase client
  const supabase = createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Check if user has an author profile
  const { data: profile } = await supabase
    .from('author_profiles')
    .select('id')
    .eq('id', user?.id)
    .single();

  // Check if user has any books
  const { data: books } = await supabase
    .from('books')
    .select('id')
    .eq('author_id', user?.id)
    .limit(1);

  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-zinc-400">
          Follow these steps to set up your author profile
        </p>
      </div>

      {/* Steps list */}
      <div className="space-y-4">
        {/* Step 1: Author Profile */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center space-x-4">
            <div
              className={`rounded-full p-2 ${profile ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {profile ? '✓' : '1'}
            </div>
            <div>
              <h3 className="font-medium text-white">Create Author Profile</h3>
              <p className="text-sm text-zinc-400">
                Add your bio and expertise
              </p>
            </div>
          </div>
          <Link
            href="/onboarding/profile"
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            {profile ? 'Edit' : 'Start'}
          </Link>
        </div>

        {/* Step 2: Add Book */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-4">
          <div className="flex items-center space-x-4">
            <div
              className={`rounded-full p-2 ${books?.length ? 'bg-green-500/20 text-green-500' : 'bg-zinc-800 text-zinc-400'}`}
            >
              {books?.length ? '✓' : '2'}
            </div>
            <div>
              <h3 className="font-medium text-white">Add Your Book</h3>
              <p className="text-sm text-zinc-400">Enter your book details</p>
            </div>
          </div>
          <Link
            href="/onboarding/book"
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white hover:bg-zinc-700"
          >
            {books?.length ? 'Edit' : 'Start'}
          </Link>
        </div>
      </div>
    </div>
  );
}
