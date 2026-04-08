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

export interface Clause {
  id: string;
  number: string;
  title: string;
  text: string;
  category: ClauseCategory;
  references: string[];
  riskLevel: RiskLevel;
  riskNotes: string;
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
  | { type: 'RESET' };

export interface SuggestResponse {
  suggestions: Array<{
    type: 'modify' | 'add' | 'remove';
    originalText: string;
    suggestedText: string;
    rationale: string;
  }>;
  alternatives: Array<{
    text: string;
    pros: string[];
    cons: string[];
  }>;
  negotiationTips: string[];
}