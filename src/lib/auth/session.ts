import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db/client';
import type { DbSession } from '@/types/auth';

export const SESSION_COOKIE_NAME = 'session_token';
const SESSION_DURATION_DAYS = 30;

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSession(userId: string): Promise<string> {
  const db = getDb();
  const id = nanoid();
  const token = generateToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_DAYS * 24 * 60 * 60;

  await db
    .prepare('INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(id, userId, token, expiresAt)
    .run();

  return token;
}

export async function verifySession(token: string): Promise<string | null> {
  if (!token) return null;

  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  const result = await db
    .prepare(
      'SELECT user_id, expires_at FROM sessions WHERE token = ? AND expires_at > ?',
    )
    .bind(token, now)
    .first<DbSession>();

  if (!result) return null;

  return result.user_id;
}

export async function deleteSession(token: string): Promise<void> {
  const db = getDb();
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export async function deleteExpiredSessions(): Promise<void> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run();
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  };
}

export function getClearCookieOptions() {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}