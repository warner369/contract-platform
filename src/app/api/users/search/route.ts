import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { requireAuth } from '@/lib/db/authHelpers';

export const maxDuration = 60;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const db = getDb();

    const results = await db
      .prepare('SELECT id, name, email FROM users WHERE email LIKE ? OR name LIKE ? LIMIT 10')
      .bind(`%${query}%`, `%${query}%`)
      .all<{ id: string; name: string; email: string }>();

    const users = (results.results || []).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}