import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/contracts', '/invite'];
const authRoutes = ['/login', '/register'];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname === route);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Lightweight cookie-presence check only.
  // Full session verification happens in API routes / server components
  // which have access to D1 via getCloudflareContext().
  const token = request.cookies.get('session_token')?.value;

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute(pathname) && !token) {
    const loginUrl = new URL('/login', request.nextUrl);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register
  if (isAuthRoute(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};