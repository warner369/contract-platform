export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

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

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface DbUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  password_salt: string;
  created_at: number;
  updated_at: number;
}

export interface DbSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: number;
  created_at: number;
}

export function mapDbUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    createdAt: new Date(dbUser.created_at * 1000).toISOString(),
    updatedAt: new Date(dbUser.updated_at * 1000).toISOString(),
  };
}