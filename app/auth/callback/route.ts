import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Auth callback handler
 * Handles redirects from:
 * - Email verification
 * - Password reset
 * - OAuth providers
 */
export async function GET(request: Request) {
  // Get the code and next URL from query params
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    // Create supabase server client
    const cookieStore = cookies();
    const supabase = createClient();

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful auth - redirect to next URL
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Something went wrong - redirect to error page
  return NextResponse.redirect(new URL('/auth/auth-error', request.url));
}
