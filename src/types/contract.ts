import type { FeedbackMode } from '@/lib/feedback-mode';
export type { FeedbackMode };

export type RiskLevel = 'low' | 'medium' | 'high';

export type ClauseCategory =
  | 'definitions'
  | 'payment'
  | 'liability'
  | 'termination'
  | 'ip'
  | 'confidentiality'
  | 'indemnity'
  | 'force_majeure'
  | 'dispute_resolution'
  | 'general'
  | 'other';

export type ContractLifecycleState =
  | 'uploaded'
  | 'structured'
  | 'internal_review'
  | 'in_negotiation'
  | 'agreed'
  | 'finalised';

export type NoteVisibility = 'internal' | 'external';

export type ClauseNote = {
  id: string;
  clauseId: string;
  content: string;
  visibility: NoteVisibility;
  createdAt: string;
};

export type ThreadMessage = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type ConversationThread = {
  id: string;
  clauseId: string;
  messages: ThreadMessage[];
  resolved: boolean;
  createdAt: string;
};

export type ContractVariable = {
  id: string;
  name: string;
  value: string;
  affectedClauseIds: string[];
};

export type AuditEntry = {
  id: string;
  action: string;
  clauseId?: string;
  detail: string;
  timestamp: string;
};

export type ParsingConfidence = 'high' | 'medium' | 'low';

export interface Clause {
  id: string;
  number: string;
  title: string;
  text: string;
  category: ClauseCategory;
  references: string[];
  riskLevel: RiskLevel;
  riskNotes: string;
  confidence?: ParsingConfidence;
}

export interface ParsedContract {
  title: string;
  summary: string;
  parties: string[];
  clauses: Clause[];
}

export interface ClauseAnalysis {
  explanation: string;
  risks: string[];
  opportunities: string[];
  relatedClauses: Array<{
    clauseId: string;
    relationship: string;
  }>;
  recommendations: string[];
}

export interface ClauseChange {
  id: string;
  clauseId: string;
  type: 'modify' | 'add' | 'remove';
  originalText: string;
  suggestedText: string;
  rationale: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ContractState {
  original: ParsedContract | null;
  current: ParsedContract | null;
  changes: ClauseChange[];
  notes: ClauseNote[];
  threads: ConversationThread[];
  variables: ContractVariable[];
  auditLog: AuditEntry[];
  lifecycleState: ContractLifecycleState;
  feedbackMode: FeedbackMode;
  selectedClauseId: string | null;
  isLoading: boolean;
  error: string | null;
}

export type ContractAction =
  | { type: 'SET_CONTRACT'; payload: ParsedContract }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_CLAUSE'; payload: string | null }
  | { type: 'APPLY_CHANGE'; payload: ClauseChange }
  | { type: 'REJECT_CHANGE'; payload: string }
  | { type: 'PROPOSE_CHANGE'; payload: ClauseChange }
  | { type: 'ADD_CLAUSE_NOTE'; payload: ClauseNote }
  | { type: 'REMOVE_CLAUSE_NOTE'; payload: string }
  | { type: 'SET_LIFECYCLE_STATE'; payload: ContractLifecycleState }
  | { type: 'ADD_THREAD'; payload: ConversationThread }
  | { type: 'ADD_THREAD_MESSAGE'; payload: { threadId: string; message: ThreadMessage } }
  | { type: 'RESOLVE_THREAD'; payload: string }
  | { type: 'SET_VARIABLE'; payload: ContractVariable }
  | { type: 'ADD_AUDIT_ENTRY'; payload: AuditEntry }
  | { type: 'SET_FEEDBACK_MODE'; payload: FeedbackMode }
  | { type: 'RESET' };

export interface SuggestResponse {
  suggestions: Array<{
    type: 'modify' | 'add' | 'remove';
    originalText: string;
    suggestedText: string;
    rationale: string;
  }>;
  alternatives: Array<{
    label?: string;
    text: string;
    pros: string[];
    cons: string[];
  }>;
  negotiationTips: string[];
}