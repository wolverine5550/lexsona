import { PasswordResetForm } from '@/components/ui/AuthForms/PasswordResetForm';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ResetPasswordPage() {
  // Check if user is already signed in
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Redirect to dashboard if already signed in and not in recovery mode
  if (user && !window?.location?.hash?.includes('type=recovery')) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">Reset Your Password</h1>
        <p className="mt-2 text-zinc-400">
          Enter your email to receive a password reset link
        </p>
      </div>

      {/* Password Reset Form */}
      <PasswordResetForm />
    </div>
  );
}
