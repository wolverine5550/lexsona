import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware to handle auth state and protected routes
 * - Refreshes session if needed
 * - Redirects unauthenticated users from protected routes
 * - Redirects authenticated users from auth pages
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    // Protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        // Store the original URL in the search params
        const redirectUrl = new URL('/signin', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // If there's an auth error, redirect to sign in
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/dashboard/:path*']
};
