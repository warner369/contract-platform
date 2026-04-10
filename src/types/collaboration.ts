export type CollaboratorPermission = 'read' | 'comment' | 'edit';

export interface ContractCollaborator {
  id: string;
  contractId: string;
  userId: string;
  permission: CollaboratorPermission;
  acceptedAt: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

export interface ContractInvite {
  id: string;
  contractId: string;
  token: string;
  permission: CollaboratorPermission;
  createdBy: string;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface DbCollaborator {
  id: string;
  contract_id: string;
  user_id: string;
  permission: string;
  accepted_at: number | null;
  created_at: number;
}

export interface DbInvite {
  id: string;
  contract_id: string;
  token: string;
  permission: string;
  created_by: string;
  used_at: number | null;
  expires_at: number | null;
  created_at: number;
}

export function mapDbCollaborator(
  db: DbCollaborator,
  userName: string,
  userEmail: string,
): ContractCollaborator {
  return {
    id: db.id,
    contractId: db.contract_id,
    userId: db.user_id,
    permission: db.permission as CollaboratorPermission,
    acceptedAt: db.accepted_at ? new Date(db.accepted_at * 1000).toISOString() : null,
    createdAt: new Date(db.created_at * 1000).toISOString(),
    userName,
    userEmail,
  };
}

export function mapDbInvite(db: DbInvite): ContractInvite {
  return {
    id: db.id,
    contractId: db.contract_id,
    token: db.token,
    permission: db.permission as CollaboratorPermission,
    createdBy: db.created_by,
    usedAt: db.used_at ? new Date(db.used_at * 1000).toISOString() : null,
    expiresAt: db.expires_at ? new Date(db.expires_at * 1000).toISOString() : null,
    createdAt: new Date(db.created_at * 1000).toISOString(),
  };
}