import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, extractSessionToken, getClearCookieOptions } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = extractSessionToken(request.headers.get('cookie') ?? '');

    if (token) {
      await deleteSession(token);
    }

    const cookieOptions = getClearCookieOptions();

    const response = NextResponse.json({ success: true });
    response.cookies.set(cookieOptions.name, '', {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}