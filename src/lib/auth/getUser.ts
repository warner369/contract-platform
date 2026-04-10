import { getDb } from '@/lib/db/client';
import { verifySession } from './session';
import { mapDbUser, type DbUser, type User } from '@/types/auth';

export async function getUserFromRequest(
  request: Request,
): Promise<User | null> {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const token = extractSessionToken(cookieHeader);
  if (!token) return null;

  const userId = await verifySession(token);
  if (!userId) return null;

  const db = getDb();
  const dbUser = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(userId)
    .first<DbUser>();

  if (!dbUser) return null;

  return mapDbUser(dbUser);
}

export function extractSessionToken(cookieHeader: string): string | null {
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith('session_token=')) {
      return cookie.substring('session_token='.length);
    }
  }
  return null;
}