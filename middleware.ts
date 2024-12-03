import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware to handle auth state and protected routes
 * - Refreshes session if needed
 * - Redirects unauthenticated users from protected routes
 * - Redirects authenticated users from auth pages
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        }
      }
    }
  );

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    console.log('Middleware check:', {
      path: request.nextUrl.pathname,
      hasUser: !!user,
      error
    });

    // Protected routes
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      if (!user) {
        const redirectUrl = new URL('/signin', request.url);
        redirectUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return response;
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: ['/dashboard/:path*']
};
