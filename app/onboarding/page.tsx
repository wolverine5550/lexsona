import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { AuthorProfileForm } from '@/components/forms/AuthorProfileForm';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function OnboardingPage() {
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/signin');
    }

    const { data: profile } = await supabase
      .from('author_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return (
      <div className="space-y-6">
        <AuthorProfileForm existingProfile={profile} />
      </div>
    );
  } catch (error) {
    console.error('Error in onboarding page:', error);
    redirect('/signin');
  }
}
