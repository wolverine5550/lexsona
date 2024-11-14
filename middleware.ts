import { type NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
import { createClient } from '@/utils/supabase/middleware';
import { hasCompletedOnboarding } from '@/utils/supabase/queries';

/**
 * Middleware function to handle authentication and routing
 * This runs on every request to check auth status and handle redirects
 *
 * @param request - The incoming request object
 * @returns Response object with appropriate redirects
 */
export async function middleware(request: NextRequest) {
  try {
    // Create Supabase client for this request
    const { supabase, response } = createClient(request);

    // Update the session if needed (handles token refresh)
    await updateSession(request);

    // Get current user
    const {
      data: { user }
    } = await supabase.auth.getUser();

    // Get the current path
    const path = new URL(request.url).pathname;

    // Define protected routes that require authentication
    const protectedRoutes = ['/account', '/dashboard', '/podcasts'];

    // Define onboarding routes
    const onboardingRoutes = [
      '/onboarding',
      '/onboarding/profile',
      '/onboarding/book'
    ];

    // If user is not authenticated and tries to access protected routes
    if (!user && protectedRoutes.includes(path)) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('redirectedFrom', path);
      return Response.redirect(redirectUrl);
    }

    // If user is authenticated, check onboarding status
    if (user) {
      const hasOnboarded = await hasCompletedOnboarding(supabase);

      // If onboarding is not complete and user is not on an onboarding route
      if (!hasOnboarded && !onboardingRoutes.includes(path)) {
        return Response.redirect(new URL('/onboarding', request.url));
      }

      // If onboarding is complete and user tries to access onboarding routes
      if (hasOnboarded && onboardingRoutes.includes(path)) {
        return Response.redirect(new URL('/dashboard', request.url));
      }
    }

    return response;
  } catch (error) {
    // Log any errors and return the original response
    console.error('Middleware error:', error);
    return Response.redirect(new URL('/', request.url));
  }
}

/**
 * Configuration for which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
