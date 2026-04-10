import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { verifyPassword, createSession, getSessionCookieOptions } from '@/lib/auth';
import { mapDbUser, type DbUser } from '@/types/auth';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const db = getDb();

    const dbUser = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind((email as string).toLowerCase())
      .first<DbUser>();

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const isValid = await verifyPassword(password, dbUser.password_hash, dbUser.password_salt);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const token = await createSession(dbUser.id);
    const user = mapDbUser(dbUser);
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({ user });
    response.cookies.set(cookieOptions.name, token, {
      httpOnly: cookieOptions.httpOnly,
      secure: cookieOptions.secure,
      sameSite: cookieOptions.sameSite,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}