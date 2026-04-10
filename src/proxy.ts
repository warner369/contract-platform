import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/session';

const protectedRoutes = ['/dashboard', '/contracts', '/invite'];
const authRoutes = ['/login', '/register'];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Read session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  let userId: string | null = null;

  if (token) {
    try {
      userId = await verifySession(token);
    } catch {
      // Invalid or expired token, or D1 not available in dev
      // In development, proceed without auth check
    }
  }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute(pathname) && !userId) {
    const loginUrl = new URL('/login', request.nextUrl);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register
  if (isAuthRoute(pathname) && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};