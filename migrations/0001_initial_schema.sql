-- Migration number: 0001 	 2026-04-10T04:39:23.603Z

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  parties TEXT NOT NULL DEFAULT '[]',
  lifecycle_state TEXT NOT NULL DEFAULT 'uploaded',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON contracts(owner_id);

-- Clauses table
CREATE TABLE IF NOT EXISTS clauses (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  risk_level TEXT NOT NULL DEFAULT 'low',
  risk_notes TEXT NOT NULL DEFAULT '',
  confidence TEXT NOT NULL DEFAULT 'medium',
  references_json TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_clauses_contract_id ON clauses(contract_id);

-- Contract collaborators
CREATE TABLE IF NOT EXISTS contract_collaborators (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL CHECK(permission IN ('read', 'comment', 'edit')),
  accepted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collaborators_contract_user ON contract_collaborators(contract_id, user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON contract_collaborators(user_id);

-- Contract invites (shareable links)
CREATE TABLE IF NOT EXISTS contract_invites (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  permission TEXT NOT NULL CHECK(permission IN ('read', 'comment', 'edit')),
  created_by TEXT NOT NULL,
  used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_token ON contract_invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_contract_id ON contract_invites(contract_id);

-- Notes (clause-level)
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK(visibility IN ('internal', 'external')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_clause_id ON notes(clause_id);

-- Threads (clause-level discussions)
CREATE TABLE IF NOT EXISTS threads (
  id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_threads_clause_id ON threads(clause_id);

-- Thread messages
CREATE TABLE IF NOT EXISTS thread_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON thread_messages(thread_id);

-- Changes (suggested/accepted/rejected clause modifications)
CREATE TABLE IF NOT EXISTS changes (
  id TEXT PRIMARY KEY,
  clause_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('modify', 'add', 'remove')),
  original_text TEXT NOT NULL DEFAULT '',
  suggested_text TEXT NOT NULL DEFAULT '',
  rationale TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
  proposed_by TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (clause_id) REFERENCES clauses(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (proposed_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_changes_clause_id ON changes(clause_id);
CREATE INDEX IF NOT EXISTS idx_changes_contract_id ON changes(contract_id);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  clause_id TEXT,
  detail TEXT NOT NULL DEFAULT '',
  timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_contract_id ON audit_log(contract_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);