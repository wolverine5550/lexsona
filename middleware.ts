import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle auth state and protected routes
 * - Refreshes session if needed
 * - Redirects unauthenticated users from protected routes
 * - Redirects authenticated users from auth pages
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  // Refresh session if needed
  await supabase.auth.getSession();

  // Get URL information
  const { pathname } = request.nextUrl;
  const {
    data: { session }
  } = await supabase.auth.getSession();

  // Define protected and auth routes
  const protectedRoutes = ['/dashboard', '/onboarding'];
  const authRoutes = ['/signin', '/signup', '/reset-password'];

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if route is auth page
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect if needed
  if (isProtectedRoute && !session) {
    // Redirect unauthenticated users to sign in
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (isAuthRoute && session) {
    // Redirect authenticated users to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

// Configure which routes use this middleware
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
