import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/contracts', '/invite'];
const authRoutes = ['/login', '/register'];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => route === pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('session_token')?.value;

  if (isProtectedRoute(pathname) && !token) {
    const loginUrl = new URL('/login', request.nextUrl);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute(pathname) && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

export const runtime = 'experimental-edge';