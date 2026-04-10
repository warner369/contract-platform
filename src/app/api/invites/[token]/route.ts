import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { mapDbInvite, type DbInvite } from '@/types/collaboration';

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;

  try {
    const db = getDb();

    const invite = await db
      .prepare('SELECT * FROM contract_invites WHERE token = ?')
      .bind(token)
      .first();

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const inviteRecord = invite as unknown as DbInvite;
    if (inviteRecord.expires_at && inviteRecord.expires_at < now) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    if (inviteRecord.used_at) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 410 });
    }

    const contract = await db
      .prepare('SELECT id, title FROM contracts WHERE id = ?')
      .bind(inviteRecord.contract_id)
      .first<{ id: string; title: string }>();

    const inviter = await db
      .prepare('SELECT id, name, email FROM users WHERE id = ?')
      .bind(inviteRecord.created_by)
      .first<{ id: string; name: string; email: string }>();

    return NextResponse.json({
      invite: mapDbInvite(inviteRecord),
      contract: contract ? { id: contract.id, title: contract.title } : null,
      inviter: inviter ? { id: inviter.id, name: inviter.name } : null,
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 });
  }
}