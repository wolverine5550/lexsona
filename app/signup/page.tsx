import { SignUpForm } from '@/components/ui/AuthForms/SignUpForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  // Check if user is already signed in
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Redirect to dashboard if already signed in
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Account for navbar height with mt-16 */}
      <div className="flex flex-1 items-center justify-center mt-16">
        <div className="w-full max-w-md px-4">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">
              Create Your Account
            </h1>
            <p className="mt-2 text-zinc-400">
              Join thousands of authors growing their audience
            </p>
          </div>

          {/* Sign Up Form */}
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
