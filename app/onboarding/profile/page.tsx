import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AuthorProfileForm } from '@/components/forms/AuthorProfileForm';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

/**
 * Author Profile Form Page
 * This is where authors enter their bio, expertise, and other profile details
 * The form handles both creation and updates of author profiles
 */
export default async function ProfilePage() {
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

  // Check if user already has a profile
  const { data: profile } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Author Profile</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Tell us about yourself and your expertise
        </p>
      </div>

      <ErrorBoundary>
        <AuthorProfileForm existingProfile={profile} />
      </ErrorBoundary>
    </div>
  );
}
