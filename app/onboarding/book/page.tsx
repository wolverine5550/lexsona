import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BookForm from '@/components/forms/BookForm';

/**
 * Book Details Form Page
 * Second step of onboarding where authors add their book information
 * Requires an author profile to be completed first
 */
export default async function BookPage() {
  // Create server-side Supabase client
  const supabase = createClient();

  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // If no user, redirect to sign in
  if (!user) {
    redirect('/signin');
  }

  // Check if user has an author profile
  const { data: profile } = await supabase
    .from('author_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  // If no profile, redirect to profile creation
  if (!profile) {
    redirect('/onboarding/profile');
  }

  // Get existing book if any
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('author_id', user.id)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Book Details</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tell us about your book to help find the right podcasts
        </p>
      </div>

      {/* Book Form */}
      <BookForm existingBook={book} />
    </div>
  );
}
