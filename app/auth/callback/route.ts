import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { hasCompletedOnboarding } from '@/utils/supabase/queries';

/**
 * Handles the authentication callback from Supabase Auth
 * This route is called after a user signs in or signs up
 * It checks the user's onboarding status and redirects accordingly
 *
 * @param request - The incoming request object
 * @returns Response with appropriate redirect
 */
export async function GET(request: NextRequest) {
  try {
    // Extract the code and next parameters from the URL
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') || '/';

    // If there's no code, redirect to sign in
    if (!code) {
      console.error('No code provided in auth callback');
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Create a Supabase client
    const supabase = createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // If there's an error, redirect to sign in
    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Get the current user
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // If no user, something went wrong
    if (!user) {
      console.error('No user found after code exchange');
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Check if the user has completed onboarding
    const hasOnboarded = await hasCompletedOnboarding(supabase);

    // If they haven't completed onboarding, send them there
    if (!hasOnboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    // Otherwise, redirect to the requested page or dashboard
    return NextResponse.redirect(new URL(next, request.url));
  } catch (error) {
    // Log any unexpected errors and redirect to sign in
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}
