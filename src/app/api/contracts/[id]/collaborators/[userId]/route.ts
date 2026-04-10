import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getContractAccess, requireOwner } from '@/lib/db/authHelpers';

export const maxDuration = 60;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const { id, userId } = await params;

  const access = await getContractAccess(request, id, 'edit');
  if (access instanceof NextResponse) return access;

  const ownerCheck = requireOwner(access);
  if (ownerCheck) return ownerCheck;

  try {
    const body = (await request.json()) as { permission?: string };
    const { permission } = body;

    if (!permission || !['read', 'comment', 'edit'].includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission level' }, { status: 400 });
    }

    const db = getDb();

    await db
      .prepare('UPDATE contract_collaborators SET permission = ? WHERE contract_id = ? AND user_id = ?')
      .bind(permission, id, userId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update collaborator error:', error);
    return NextResponse.json({ error: 'Failed to update collaborator' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
): Promise<NextResponse> {
  const { id, userId } = await params;

  const access = await getContractAccess(request, id, 'edit');
  if (access instanceof NextResponse) return access;

  const ownerCheck = requireOwner(access);
  if (ownerCheck) return ownerCheck;

  try {
    const db = getDb();

    await db
      .prepare('DELETE FROM contract_collaborators WHERE contract_id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
}