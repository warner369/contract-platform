import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db/client';
import type { User } from '@/types/auth';

type Permission = 'read' | 'comment' | 'edit';

const ROLE_HIERARCHY: Record<Permission, number> = {
  read: 0,
  comment: 1,
  edit: 2,
};

export async function requireAuth(request: Request): Promise<User | NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return user;
}

export async function getContractAccess(
  request: Request,
  contractId: string,
  requiredPermission: Permission = 'read',
): Promise<{ user: User; role: 'owner' | 'collaborator'; permission: Permission } | NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const db = getDb();

  const contract = await db
    .prepare('SELECT owner_id FROM contracts WHERE id = ?')
    .bind(contractId)
    .first<{ owner_id: string }>();

  if (!contract) {
    return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
  }

  if (contract.owner_id === user.id) {
    return { user, role: 'owner', permission: 'edit' };
  }

  const collaborator = await db
    .prepare('SELECT permission, accepted_at FROM contract_collaborators WHERE contract_id = ? AND user_id = ?')
    .bind(contractId, user.id)
    .first<{ permission: Permission; accepted_at: number | null }>();

  if (!collaborator || !collaborator.accepted_at) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  if (ROLE_HIERARCHY[collaborator.permission] < ROLE_HIERARCHY[requiredPermission]) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  return { user, role: 'collaborator', permission: collaborator.permission };
}

export function requireOwner(
  access: { user: User; role: 'owner' | 'collaborator'; permission: Permission },
): NextResponse | null {
  if (access.role !== 'owner') {
    return NextResponse.json({ error: 'Only the contract owner can perform this action' }, { status: 403 });
  }
  return null;
}