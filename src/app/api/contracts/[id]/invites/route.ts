import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db/client';
import { getContractAccess, requireOwner } from '@/lib/db/authHelpers';
import { mapDbInvite, type DbInvite } from '@/types/collaboration';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const access = await getContractAccess(request, id, 'edit');
  if (access instanceof NextResponse) return access;

  const ownerCheck = requireOwner(access);
  if (ownerCheck) return ownerCheck;

  try {
    const body = (await request.json()) as { permission?: string };
    const { permission = 'read' } = body;

    if (!['read', 'comment', 'edit'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 });
    }

    const db = getDb();
    const inviteId = nanoid();
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 7 * 24 * 60 * 60; // 7 days

    await db
      .prepare(
        'INSERT INTO contract_invites (id, contract_id, token, permission, created_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(inviteId, id, token, permission, access.user.id, expiresAt, now)
      .run();

    const invite = await db
      .prepare('SELECT * FROM contract_invites WHERE id = ?')
      .bind(inviteId)
      .first();

    return NextResponse.json(mapDbInvite(invite as unknown as DbInvite), { status: 201 });
  } catch (error) {
    console.error('Create invite error:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}