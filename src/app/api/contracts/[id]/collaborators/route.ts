import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getContractAccess } from '@/lib/db/authHelpers';
import { mapDbCollaborator } from '@/types/collaboration';

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const access = await getContractAccess(request, id);
  if (access instanceof NextResponse) return access;

  try {
    const db = getDb();

    const collaborators = await db
      .prepare(
        `SELECT cc.*, u.name as user_name, u.email as user_email
         FROM contract_collaborators cc
         JOIN users u ON cc.user_id = u.id
         WHERE cc.contract_id = ? AND cc.accepted_at IS NOT NULL
         ORDER BY cc.created_at`,
      )
      .bind(id)
      .all();

    const result = (collaborators.results || []).map((c: Record<string, unknown>) =>
      mapDbCollaborator(
        {
          id: c.id as string,
          contract_id: c.contract_id as string,
          user_id: c.user_id as string,
          permission: c.permission as string,
          accepted_at: c.accepted_at as number | null,
          created_at: c.created_at as number,
        },
        c.user_name as string,
        c.user_email as string,
      ),
    );

    return NextResponse.json({ collaborators: result });
  } catch (error) {
    console.error('List collaborators error:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}