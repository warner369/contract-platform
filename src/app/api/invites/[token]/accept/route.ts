import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db/client';
import { getUserFromRequest } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await params;

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const db = getDb();

    const invite = await db
      .prepare('SELECT * FROM contract_invites WHERE token = ?')
      .bind(token)
      .first<{
        id: string;
        contract_id: string;
        permission: string;
        used_at: number | null;
        expires_at: number | null;
      }>();

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (invite.expires_at && invite.expires_at < now) {
      return NextResponse.json({ error: 'Invite has expired' }, { status: 410 });
    }

    if (invite.used_at) {
      return NextResponse.json({ error: 'Invite has already been used' }, { status: 410 });
    }

    // Check if user is the contract owner
    const contract = await db
      .prepare('SELECT owner_id FROM contracts WHERE id = ?')
      .bind(invite.contract_id)
      .first<{ owner_id: string }>();

    if (contract && contract.owner_id === user.id) {
      return NextResponse.json({ error: 'You cannot accept your own invite' }, { status: 400 });
    }

    // Check if user is already a collaborator
    const existing = await db
      .prepare('SELECT id FROM contract_collaborators WHERE contract_id = ? AND user_id = ?')
      .bind(invite.contract_id, user.id)
      .first<{ id: string }>();

    if (existing) {
      // Update accepted_at if pending
      await db
        .prepare('UPDATE contract_collaborators SET accepted_at = ? WHERE id = ?')
        .bind(now, existing.id)
        .run();
    } else {
      // Create collaborator
      await db
        .prepare(
          'INSERT INTO contract_collaborators (id, contract_id, user_id, permission, accepted_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        )
        .bind(nanoid(), invite.contract_id, user.id, invite.permission, now, now)
        .run();
    }

    // Mark invite as used
    await db
      .prepare('UPDATE contract_invites SET used_at = ? WHERE id = ?')
      .bind(now, invite.id)
      .run();

    return NextResponse.json({
      success: true,
      contractId: invite.contract_id,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}